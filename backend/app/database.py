from sqlalchemy import (
    Column, String, Float, Integer, DateTime, JSON, Boolean, Text,
    ForeignKey, CheckConstraint, create_engine
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from datetime import datetime, timezone
import os
import uuid

# Mirrors backend/db/schema.sql 1:1. If you change one, change the other —
# this file is the runtime source of truth for local/sqlite dev, schema.sql
# is the source of truth for the hosted Postgres/Supabase instance (it also
# carries RLS policies and Realtime config that SQLAlchemy can't express).

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./phi.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, nullable=False, unique=True)
    full_name = Column(String)
    role = Column(String, nullable=False, default="driver")
    dot_number = Column(String)
    mc_number = Column(String)
    home_city = Column(String)
    home_state = Column(String)
    truck_make = Column(String)
    truck_model = Column(String)
    truck_year = Column(Integer)
    truck_vin = Column(String)
    equipment_type = Column(String, default="Dry Van")
    subscription_tier = Column(String, nullable=False, default="Solo")
    min_rpm = Column(Float, default=2.50)
    auto_book_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    __table_args__ = (
        CheckConstraint("role in ('driver', 'admin', 'ceo')", name="ck_users_role"),
        CheckConstraint(
            "subscription_tier in ('Solo', 'Fleet', 'Enterprise')",
            name="ck_users_subscription_tier",
        ),
    )


class ActiveLoad(Base):
    __tablename__ = "active_loads"
    id = Column(String, primary_key=True, default=_uuid)
    driver_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"))
    broker_name = Column(String)
    broker_mc_number = Column(String)
    origin_city = Column(String, nullable=False)
    origin_state = Column(String, nullable=False)
    origin_lat = Column(Float)
    origin_lng = Column(Float)
    destination_city = Column(String, nullable=False)
    destination_state = Column(String, nullable=False)
    destination_lat = Column(Float)
    destination_lng = Column(Float)
    payout_amount = Column(Float, nullable=False)
    miles = Column(Integer, nullable=False)
    equipment_type = Column(String, default="Dry Van")
    status = Column(String, nullable=False, default="available")
    pickup_date = Column(String)
    delivery_date = Column(String)
    risk_score = Column(Integer)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    __table_args__ = (
        CheckConstraint("payout_amount > 0", name="ck_active_loads_payout_amount"),
        CheckConstraint("miles > 0", name="ck_active_loads_miles"),
        CheckConstraint(
            "status in ('available', 'booked', 'in_transit', 'delivered', 'cancelled')",
            name="ck_active_loads_status",
        ),
        CheckConstraint(
            "risk_score is null or risk_score between 0 and 10",
            name="ck_active_loads_risk_score",
        ),
    )

    @property
    def rpm(self) -> float | None:
        # Generated column in schema.sql; sqlite has no portable equivalent
        # via SQLAlchemy, so it's derived on read instead.
        if not self.miles:
            return None
        return round(self.payout_amount / self.miles, 2)


class AIActionLog(Base):
    __tablename__ = "ai_action_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    driver_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    load_id = Column(String, ForeignKey("active_loads.id", ondelete="SET NULL"))
    agent_name = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    # Mapped to db column "metadata" — the Python attr can't be named
    # `metadata`, that's a reserved name on the declarative base.
    log_metadata = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_now)

    __table_args__ = (
        CheckConstraint(
            "action_type in ('scan', 'negotiate', 'dispatch', 'route', 'fuel', "
            "'invoice', 'compliance', 'maintenance', 'alert', 'briefing')",
            name="ck_ai_action_logs_action_type",
        ),
    )


class FinancialVault(Base):
    __tablename__ = "financial_vault"
    id = Column(String, primary_key=True, default=_uuid)
    driver_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    load_id = Column(String, ForeignKey("active_loads.id", ondelete="SET NULL"))
    invoice_number = Column(String, unique=True)
    gross_amount = Column(Float, nullable=False)
    factoring_fee = Column(Float, nullable=False, default=0)
    net_amount = Column(Float, nullable=False)
    factoring_company = Column(String)
    factoring_status = Column(String, nullable=False, default="pending")
    tax_deductions = Column(JSON, default=dict)  # { fuel, tolls, per_diem, maintenance_reserve }
    total_deductions = Column(Float, nullable=False, default=0)
    cleared_at = Column(DateTime)
    created_at = Column(DateTime, default=_now)

    __table_args__ = (
        CheckConstraint(
            "factoring_status in ('pending', 'submitted', 'advanced', 'paid', 'rejected')",
            name="ck_financial_vault_factoring_status",
        ),
    )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)


# ─── Write helpers ───────────────────────────────────────────────────────────
# Called from tasks.py's CrewAI task_callback hooks and main.py's workflow
# handlers to persist agent activity and financial events as they happen, so
# the WebSocket layer has something durable to broadcast from.

def log_agent_action(
    db,
    *,
    agent_name: str,
    action_type: str,
    summary: str,
    driver_id: str | None = None,
    load_id: str | None = None,
    metadata: dict | None = None,
) -> AIActionLog:
    entry = AIActionLog(
        agent_name=agent_name,
        action_type=action_type,
        summary=summary,
        driver_id=driver_id,
        load_id=load_id,
        log_metadata=metadata or {},
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def clear_invoice(
    db,
    *,
    driver_id: str,
    gross_amount: float,
    factoring_fee: float = 0,
    factoring_company: str | None = None,
    tax_deductions: dict | None = None,
    load_id: str | None = None,
    invoice_number: str | None = None,
) -> FinancialVault:
    deductions = tax_deductions or {}
    entry = FinancialVault(
        driver_id=driver_id,
        load_id=load_id,
        invoice_number=invoice_number,
        gross_amount=gross_amount,
        factoring_fee=factoring_fee,
        net_amount=gross_amount - factoring_fee,
        factoring_company=factoring_company,
        factoring_status="paid",
        tax_deductions=deductions,
        total_deductions=sum(v for v in deductions.values() if isinstance(v, (int, float))),
        cleared_at=_now(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
