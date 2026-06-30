from sqlalchemy import (
    Column, String, Float, Integer, DateTime, JSON, Boolean, Text, create_engine
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from datetime import datetime, timezone
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./phi.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(String, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    subscription_tier = Column(String, default="Solo")
    home_city = Column(String)
    home_state = Column(String)
    equipment_type = Column(String, default="Dry Van")
    min_rpm = Column(Float, default=2.50)
    auto_book_enabled = Column(Boolean, default=False)
    auto_book_min_rpm = Column(Float, default=3.20)
    preferred_states = Column(JSON, default=list)
    avoid_states = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Load(Base):
    __tablename__ = "loads"
    id = Column(String, primary_key=True)
    driver_id = Column(String)
    broker_name = Column(String)
    broker_rating = Column(Float)
    origin_city = Column(String)
    origin_state = Column(String)
    destination_city = Column(String)
    destination_state = Column(String)
    rate = Column(Float)
    miles = Column(Integer)
    rpm = Column(Float)
    equipment_type = Column(String)
    pickup_date = Column(String)
    delivery_date = Column(String)
    status = Column(String, default="available")  # available | booked | in_transit | delivered
    score = Column(Integer)
    score_tier = Column(String)
    risk_level = Column(Integer)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(String, primary_key=True)
    load_id = Column(String)
    driver_id = Column(String)
    amount = Column(Float)
    fuel_surcharge = Column(Float, default=0)
    total = Column(Float)
    status = Column(String, default="pending")  # pending | submitted | paid
    factoring_company = Column(String)
    submitted_at = Column(DateTime)
    paid_at = Column(DateTime)
    bol_text = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AgentLog(Base):
    __tablename__ = "agent_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_name = Column(String)
    crew_name = Column(String)
    driver_id = Column(String)
    input_data = Column(JSON)
    output = Column(Text)
    tokens_used = Column(Integer)
    duration_ms = Column(Integer)
    success = Column(Boolean, default=True)
    error = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class HOSRecord(Base):
    __tablename__ = "hos_records"
    id = Column(Integer, primary_key=True, autoincrement=True)
    driver_id = Column(String)
    clock_in = Column(DateTime)
    clock_out = Column(DateTime)
    drive_hours = Column(Float)
    on_duty_hours = Column(Float)
    miles_driven = Column(Integer)
    states_driven = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"
    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String)
    driver_id = Column(String)
    service_type = Column(String)
    odometer = Column(Integer)
    next_due_miles = Column(Integer)
    completed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
