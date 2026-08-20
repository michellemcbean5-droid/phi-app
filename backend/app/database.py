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

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,  # detect stale connections before handing them out
        pool_recycle=3600,   # recycle connections after 1 hour to avoid server-side timeouts
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
    fcm_device_token = Column(String)  # Firebase Cloud Messaging token for push alerts
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    __table_args__ = (
        CheckConstraint("role in ('driver', 'admin', 'ceo')", name="ck_users_role"),
        CheckConstraint(
            "subscription_tier in ('Solo', 'Fleet', 'Enterprise')",
            name="ck_users_subscription_tier",
        ),
    )


class CustomerLead(Base):
    """A consented prospect or customer tracked from assessment through service delivery."""
    __tablename__ = "customer_leads"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, nullable=False, unique=True, index=True)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    company_name = Column(String)
    journey = Column(String, nullable=False, default="launch")
    stage = Column(String, nullable=False, default="new")
    lead_source = Column(String, nullable=False, default="organic")
    source_detail = Column(String)
    equipment_type = Column(String)
    truck_count = Column(Integer, nullable=False, default=0)
    home_state = Column(String)
    top_challenge = Column(String)
    preferred_contact = Column(String, nullable=False, default="email")
    consent_marketing = Column(Boolean, nullable=False, default=False)
    consent_captured_at = Column(DateTime)
    qualification_score = Column(Integer, nullable=False, default=0)
    recommended_offer = Column(String)
    owner = Column(String, nullable=False, default="PHI Acquisition Pod")
    next_action_at = Column(DateTime)
    external_crm_id = Column(String)
    onboarding_status = Column(String, nullable=False, default="not_started")
    activated_user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    __table_args__ = (
        CheckConstraint(
            "journey in ('launch', 'dispatch', 'fleet')",
            name="ck_customer_leads_journey",
        ),
        CheckConstraint(
            "stage in ('new', 'qualified', 'opportunity', 'won', 'lost', 'nurture')",
            name="ck_customer_leads_stage",
        ),
        CheckConstraint(
            "preferred_contact in ('email', 'phone', 'text')",
            name="ck_customer_leads_preferred_contact",
        ),
        CheckConstraint(
            "onboarding_status in ('not_started', 'in_progress', 'complete', 'blocked')",
            name="ck_customer_leads_onboarding_status",
        ),
        CheckConstraint(
            "qualification_score between 0 and 100",
            name="ck_customer_leads_qualification_score",
        ),
        CheckConstraint("truck_count >= 0", name="ck_customer_leads_truck_count"),
    )


class CustomerJourneyEvent(Base):
    """Append-only activity ledger for the pre-sale and post-sale customer journey."""
    __tablename__ = "customer_journey_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(String, ForeignKey("customer_leads.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)
    actor = Column(String, nullable=False, default="system")
    event_metadata = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=_now)


class CustomerFollowUp(Base):
    """A prepared or delivered customer follow-up; external delivery is always auditable."""
    __tablename__ = "customer_followups"

    id = Column(String, primary_key=True, default=_uuid)
    lead_id = Column(String, ForeignKey("customer_leads.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence_step = Column(String, nullable=False)
    channel = Column(String, nullable=False, default="email")
    status = Column(String, nullable=False, default="ready", index=True)
    subject = Column(String)
    body = Column(Text, nullable=False)
    scheduled_at = Column(DateTime)
    sent_at = Column(DateTime)
    external_message_id = Column(String)
    suppression_reason = Column(String)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    __table_args__ = (
        CheckConstraint(
            "sequence_step in ('assessment_response', 'practical_follow_up', 'close_the_loop', 'appointment_reminder')",
            name="ck_customer_followups_sequence_step",
        ),
        CheckConstraint("channel in ('email', 'calendar')", name="ck_customer_followups_channel"),
        CheckConstraint(
            "status in ('ready', 'held', 'sent', 'cancelled', 'failed', 'suppressed')",
            name="ck_customer_followups_status",
        ),
    )


class CustomerAppointment(Base):
    """A consultation request or scheduled PHI customer meeting."""
    __tablename__ = "customer_appointments"

    id = Column(String, primary_key=True, default=_uuid)
    lead_id = Column(String, ForeignKey("customer_leads.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, nullable=False, default="requested", index=True)
    booking_url = Column(String)
    provider_booking_id = Column(String)
    host_name = Column(String)
    scheduled_for = Column(DateTime)
    completed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    __table_args__ = (
        CheckConstraint(
            "status in ('requested', 'scheduled', 'completed', 'cancelled', 'no_show')",
            name="ck_customer_appointments_status",
        ),
    )


class CustomerRevenueEntry(Base):
    """A verified recurring-revenue record; forecasts never enter this table."""
    __tablename__ = "customer_revenue_entries"

    id = Column(String, primary_key=True, default=_uuid)
    lead_id = Column(String, ForeignKey("customer_leads.id", ondelete="SET NULL"), index=True)
    amount_mrr = Column(Float, nullable=False, default=0)
    status = Column(String, nullable=False, default="active", index=True)
    source = Column(String, nullable=False, default="manual_verified")
    verified_at = Column(DateTime, nullable=False, default=_now)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    __table_args__ = (
        CheckConstraint("amount_mrr >= 0", name="ck_customer_revenue_entries_amount_mrr"),
        CheckConstraint(
            "status in ('active', 'cancelled', 'paused')",
            name="ck_customer_revenue_entries_status",
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


def get_customer_lead(db, lead_id: str) -> CustomerLead | None:
    """Retrieve one customer lead without exposing customer records outside the API boundary."""
    return db.query(CustomerLead).filter(CustomerLead.id == lead_id).first()


def log_customer_event(
    db,
    lead_id: str,
    event_type: str,
    actor: str,
    metadata: dict | None = None,
) -> CustomerJourneyEvent:
    """Append a customer-lifecycle event and persist it immediately for the audit ledger."""
    event = CustomerJourneyEvent(
        lead_id=lead_id,
        event_type=event_type,
        actor=actor,
        event_metadata=metadata or {},
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_fcm_token(db, driver_id: str) -> str | None:
    """Look up a driver's FCM device token by their user ID. Returns None if not set."""
    user = db.query(User).filter(User.id == driver_id).first()
    return user.fcm_device_token if user else None


def set_fcm_token(db, driver_id: str, token: str) -> bool:
    """Persist a driver's FCM device token. Returns True on success."""
    user = db.query(User).filter(User.id == driver_id).first()
    if not user:
        return False
    user.fcm_device_token = token
    db.commit()
    return True


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


def get_customer_lead(db, lead_id: str) -> CustomerLead | None:
    """Return a customer lead by identifier, or None when no matching record exists."""
    return db.query(CustomerLead).filter(CustomerLead.id == lead_id).first()


def log_customer_event(
    db,
    *,
    lead_id: str,
    event_type: str,
    actor: str = "system",
    metadata: dict | None = None,
) -> CustomerJourneyEvent:
    """Persist an append-only lead/customer lifecycle event and return it."""
    entry = CustomerJourneyEvent(
        lead_id=lead_id,
        event_type=event_type,
        actor=actor,
        event_metadata=metadata or {},
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
