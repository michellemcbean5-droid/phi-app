"""
PHI FastAPI backend — REST API connecting the mobile app to CrewAI agents.

Endpoints mirror the 5 primary mobile-app flows plus CRUD for core entities.
All crew runs are synchronous (CrewAI sequential); for production use a task
queue (Celery / ARQ) and return a job-id for polling.
"""

import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import (
    get_db, init_db,
    UserProfile, Load, Invoice, AgentLog, HOSRecord, MaintenanceRecord,
)
from tasks.workflow_tasks import (
    build_find_freight_crew,
    build_start_trip_crew,
    build_payday_crew,
    build_compliance_crew,
    build_dashboard_crew,
)
from agents import ALL_AGENTS

app = FastAPI(
    title="Prince Haul Intelligence API",
    description="AI-powered trucking operations backend for the PHI mobile app",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ─── PYDANTIC SCHEMAS ────────────────────────────────────────────────────────

class DriverPrefsIn(BaseModel):
    driver_id: str
    equipment_type: str = "Dry Van"
    min_rpm: float = 2.50
    preferred_states: list[str] = []
    avoid_states: list[str] = []
    home_city: str = ""
    home_state: str = ""


class StartTripIn(BaseModel):
    load_id: str
    driver_id: str
    driver_lat: float
    driver_lng: float


class PaydayIn(BaseModel):
    load_id: str
    driver_id: str
    bol_text: str


class ComplianceIn(BaseModel):
    driver_id: str
    drive_hours_remaining: float = 11.0
    on_duty_hours_remaining: float = 14.0
    cycle_hours_used: float = 0.0
    vehicle_id: str = ""
    odometer: int = 0
    last_oil_change_miles: int = 0
    last_tire_rotation_miles: int = 0


class UserProfileIn(BaseModel):
    name: str
    email: str
    subscription_tier: str = "Solo"
    home_city: str = ""
    home_state: str = ""
    equipment_type: str = "Dry Van"
    min_rpm: float = 2.50
    auto_book_enabled: bool = False
    auto_book_min_rpm: float = 3.20
    preferred_states: list[str] = []
    avoid_states: list[str] = []


class LoadIn(BaseModel):
    driver_id: str
    broker_name: str
    broker_rating: float = 5.0
    origin_city: str
    origin_state: str
    destination_city: str
    destination_state: str
    rate: float
    miles: int
    equipment_type: str = "Dry Van"
    pickup_date: str
    delivery_date: str


# ─── HEALTH CHECK ────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "PHI API online", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


# ─── AGENT STATUS ────────────────────────────────────────────────────────────

@app.get("/api/workers/status")
def workers_status(db: Session = Depends(get_db)):
    """Return all 15 agents with their last log entry for the AI Command Center screen."""
    agents_out = []
    for agent in ALL_AGENTS:
        last_log = (
            db.query(AgentLog)
            .filter(AgentLog.agent_name == agent.role)
            .order_by(AgentLog.created_at.desc())
            .first()
        )
        agents_out.append({
            "name": agent.role,
            "goal": agent.goal[:120] + "..." if len(agent.goal) > 120 else agent.goal,
            "status": "idle" if not last_log else ("ok" if last_log.success else "error"),
            "last_run": last_log.created_at.isoformat() if last_log else None,
            "tasks_completed": db.query(AgentLog)
            .filter(AgentLog.agent_name == agent.role, AgentLog.success == True)
            .count(),
        })
    return {"agents": agents_out, "total": len(agents_out)}


# ─── FIND FREIGHT ─────────────────────────────────────────────────────────────

@app.post("/api/find-freight")
def find_freight(prefs: DriverPrefsIn, db: Session = Depends(get_db)):
    """
    Triggered by the 'Find Freight' button on the Command Dashboard.
    Runs: FreightNegotiator → LoadScoring → RiskAssessment crew.
    """
    driver_prefs = prefs.model_dump()
    start = datetime.now(timezone.utc)

    try:
        crew = build_find_freight_crew(driver_prefs)
        result = crew.kickoff()
        duration_ms = int((datetime.now(timezone.utc) - start).total_seconds() * 1000)

        log = AgentLog(
            agent_name="find_freight_crew",
            crew_name="FindFreightCrew",
            driver_id=prefs.driver_id,
            input_data=driver_prefs,
            output=str(result),
            duration_ms=duration_ms,
            success=True,
        )
        db.add(log)
        db.commit()

        return {"status": "success", "result": str(result), "duration_ms": duration_ms}

    except Exception as exc:
        db.add(AgentLog(
            agent_name="find_freight_crew",
            crew_name="FindFreightCrew",
            driver_id=prefs.driver_id,
            input_data=driver_prefs,
            success=False,
            error=str(exc),
        ))
        db.commit()
        raise HTTPException(status_code=500, detail=str(exc))


# ─── START TRIP ──────────────────────────────────────────────────────────────

@app.post("/api/start-trip")
def start_trip(payload: StartTripIn, db: Session = Depends(get_db)):
    """
    Triggered when driver taps 'Start Trip' after accepting a load.
    Runs: RouteOptimizer → FuelOptimizer → DispatchCoordinator → DriverLiaison crew.
    """
    load = db.query(Load).filter(Load.id == payload.load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    load_dict = {
        "id": load.id,
        "origin": f"{load.origin_city}, {load.origin_state}",
        "destination": f"{load.destination_city}, {load.destination_state}",
        "rate": load.rate,
        "miles": load.miles,
        "equipment_type": load.equipment_type,
        "broker_name": load.broker_name,
        "pickup_date": load.pickup_date,
    }
    driver_location = {"lat": payload.driver_lat, "lng": payload.driver_lng}
    start_ts = datetime.now(timezone.utc)

    try:
        crew = build_start_trip_crew(load_dict, driver_location)
        result = crew.kickoff()
        duration_ms = int((datetime.now(timezone.utc) - start_ts).total_seconds() * 1000)

        load.status = "in_transit"
        db.commit()

        db.add(AgentLog(
            agent_name="start_trip_crew",
            crew_name="StartTripCrew",
            driver_id=payload.driver_id,
            input_data={"load_id": payload.load_id, "location": driver_location},
            output=str(result),
            duration_ms=duration_ms,
            success=True,
        ))
        db.commit()

        return {"status": "success", "result": str(result), "duration_ms": duration_ms}

    except Exception as exc:
        db.add(AgentLog(
            agent_name="start_trip_crew",
            crew_name="StartTripCrew",
            driver_id=payload.driver_id,
            input_data={"load_id": payload.load_id},
            success=False,
            error=str(exc),
        ))
        db.commit()
        raise HTTPException(status_code=500, detail=str(exc))


# ─── ONE-TAP PAYDAY ──────────────────────────────────────────────────────────

@app.post("/api/payday")
def payday(payload: PaydayIn, db: Session = Depends(get_db)):
    """
    Triggered by One-Tap Payday after BOL photo is processed.
    Runs: InvoiceSpecialist → CPMCalculator → TrackTrace crew.
    """
    load = db.query(Load).filter(Load.id == payload.load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    load_dict = {
        "id": load.id,
        "origin": f"{load.origin_city}, {load.origin_state}",
        "destination": f"{load.destination_city}, {load.destination_state}",
        "rate": load.rate,
        "miles": load.miles,
        "broker_name": load.broker_name,
        "delivery_date": load.delivery_date,
        "driver_id": payload.driver_id,
    }
    start_ts = datetime.now(timezone.utc)

    try:
        crew = build_payday_crew(payload.bol_text, load_dict)
        result = crew.kickoff()
        duration_ms = int((datetime.now(timezone.utc) - start_ts).total_seconds() * 1000)

        invoice = Invoice(
            id=str(uuid.uuid4()),
            load_id=payload.load_id,
            driver_id=payload.driver_id,
            amount=load.rate,
            total=load.rate,
            status="submitted",
            bol_text=payload.bol_text,
            submitted_at=datetime.now(timezone.utc),
        )
        db.add(invoice)

        load.status = "delivered"
        db.commit()

        db.add(AgentLog(
            agent_name="payday_crew",
            crew_name="PaydayCrew",
            driver_id=payload.driver_id,
            input_data={"load_id": payload.load_id},
            output=str(result),
            duration_ms=duration_ms,
            success=True,
        ))
        db.commit()

        return {
            "status": "success",
            "invoice_id": invoice.id,
            "result": str(result),
            "duration_ms": duration_ms,
        }

    except Exception as exc:
        db.add(AgentLog(
            agent_name="payday_crew",
            crew_name="PaydayCrew",
            driver_id=payload.driver_id,
            input_data={"load_id": payload.load_id},
            success=False,
            error=str(exc),
        ))
        db.commit()
        raise HTTPException(status_code=500, detail=str(exc))


# ─── COMPLIANCE ──────────────────────────────────────────────────────────────

@app.post("/api/compliance")
def compliance(payload: ComplianceIn, db: Session = Depends(get_db)):
    """
    Compliance screen: audit HOS, maintenance, and IFTA in one shot.
    Runs: ComplianceOfficer → FleetMaintenance → IFTA crew.
    """
    hos_data = {
        "drive_hours_remaining": payload.drive_hours_remaining,
        "on_duty_hours_remaining": payload.on_duty_hours_remaining,
        "cycle_hours_used": payload.cycle_hours_used,
    }
    vehicle_data = {
        "vehicle_id": payload.vehicle_id,
        "odometer": payload.odometer,
        "last_oil_change_miles": payload.last_oil_change_miles,
        "last_tire_rotation_miles": payload.last_tire_rotation_miles,
    }
    start_ts = datetime.now(timezone.utc)

    try:
        crew = build_compliance_crew(payload.driver_id, hos_data, vehicle_data)
        result = crew.kickoff()
        duration_ms = int((datetime.now(timezone.utc) - start_ts).total_seconds() * 1000)

        db.add(AgentLog(
            agent_name="compliance_crew",
            crew_name="ComplianceCrew",
            driver_id=payload.driver_id,
            input_data={"hos": hos_data, "vehicle": vehicle_data},
            output=str(result),
            duration_ms=duration_ms,
            success=True,
        ))
        db.commit()

        return {"status": "success", "result": str(result), "duration_ms": duration_ms}

    except Exception as exc:
        db.add(AgentLog(
            agent_name="compliance_crew",
            crew_name="ComplianceCrew",
            driver_id=payload.driver_id,
            input_data={"hos": hos_data},
            success=False,
            error=str(exc),
        ))
        db.commit()
        raise HTTPException(status_code=500, detail=str(exc))


# ─── DASHBOARD ───────────────────────────────────────────────────────────────

@app.get("/api/dashboard/{driver_id}")
def dashboard(driver_id: str, period: str = "today", db: Session = Depends(get_db)):
    """
    Powers the Command Dashboard every morning.
    Runs: RevenueAnalyst → CPMCalculator → MarketIntelligence → BIExec crew.
    """
    start_ts = datetime.now(timezone.utc)

    try:
        crew = build_dashboard_crew(driver_id, period)
        result = crew.kickoff()
        duration_ms = int((datetime.now(timezone.utc) - start_ts).total_seconds() * 1000)

        db.add(AgentLog(
            agent_name="dashboard_crew",
            crew_name="DashboardCrew",
            driver_id=driver_id,
            input_data={"period": period},
            output=str(result),
            duration_ms=duration_ms,
            success=True,
        ))
        db.commit()

        return {"status": "success", "result": str(result), "duration_ms": duration_ms}

    except Exception as exc:
        db.add(AgentLog(
            agent_name="dashboard_crew",
            crew_name="DashboardCrew",
            driver_id=driver_id,
            input_data={"period": period},
            success=False,
            error=str(exc),
        ))
        db.commit()
        raise HTTPException(status_code=500, detail=str(exc))


# ─── USER PROFILE CRUD ───────────────────────────────────────────────────────

@app.post("/api/drivers", status_code=201)
def create_driver(payload: UserProfileIn, db: Session = Depends(get_db)):
    existing = db.query(UserProfile).filter(UserProfile.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    driver = UserProfile(
        id=str(uuid.uuid4()),
        **payload.model_dump(),
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return {"id": driver.id, "email": driver.email, "subscription_tier": driver.subscription_tier}


@app.get("/api/drivers/{driver_id}")
def get_driver(driver_id: str, db: Session = Depends(get_db)):
    driver = db.query(UserProfile).filter(UserProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {
        "id": driver.id,
        "name": driver.name,
        "email": driver.email,
        "subscription_tier": driver.subscription_tier,
        "home_city": driver.home_city,
        "home_state": driver.home_state,
        "equipment_type": driver.equipment_type,
        "min_rpm": driver.min_rpm,
        "auto_book_enabled": driver.auto_book_enabled,
        "auto_book_min_rpm": driver.auto_book_min_rpm,
        "preferred_states": driver.preferred_states or [],
        "avoid_states": driver.avoid_states or [],
        "created_at": driver.created_at.isoformat() if driver.created_at else None,
    }


@app.patch("/api/drivers/{driver_id}")
def update_driver(driver_id: str, payload: UserProfileIn, db: Session = Depends(get_db)):
    driver = db.query(UserProfile).filter(UserProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(driver, field, value)
    db.commit()
    return {"status": "updated"}


# ─── LOAD CRUD ───────────────────────────────────────────────────────────────

@app.post("/api/loads", status_code=201)
def create_load(payload: LoadIn, db: Session = Depends(get_db)):
    miles = payload.miles or 1
    rpm = round(payload.rate / miles, 2)
    load = Load(
        id=str(uuid.uuid4()),
        rpm=rpm,
        status="available",
        **payload.model_dump(),
    )
    db.add(load)
    db.commit()
    db.refresh(load)
    return {"id": load.id, "rpm": load.rpm, "status": load.status}


@app.get("/api/loads")
def list_loads(
    driver_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(Load)
    if driver_id:
        q = q.filter(Load.driver_id == driver_id)
    if status:
        q = q.filter(Load.status == status)
    loads = q.order_by(Load.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "broker_name": l.broker_name,
            "origin": f"{l.origin_city}, {l.origin_state}",
            "destination": f"{l.destination_city}, {l.destination_state}",
            "rate": l.rate,
            "miles": l.miles,
            "rpm": l.rpm,
            "status": l.status,
            "score": l.score,
            "score_tier": l.score_tier,
            "pickup_date": l.pickup_date,
        }
        for l in loads
    ]


@app.get("/api/loads/{load_id}")
def get_load(load_id: str, db: Session = Depends(get_db)):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    return {
        "id": load.id,
        "broker_name": load.broker_name,
        "broker_rating": load.broker_rating,
        "origin_city": load.origin_city,
        "origin_state": load.origin_state,
        "destination_city": load.destination_city,
        "destination_state": load.destination_state,
        "rate": load.rate,
        "miles": load.miles,
        "rpm": load.rpm,
        "equipment_type": load.equipment_type,
        "pickup_date": load.pickup_date,
        "delivery_date": load.delivery_date,
        "status": load.status,
        "score": load.score,
        "score_tier": load.score_tier,
        "risk_level": load.risk_level,
    }


@app.patch("/api/loads/{load_id}/book")
def book_load(load_id: str, driver_id: str, db: Session = Depends(get_db)):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if load.status != "available":
        raise HTTPException(status_code=409, detail=f"Load is already {load.status}")
    load.status = "booked"
    load.driver_id = driver_id
    db.commit()
    return {"status": "booked", "load_id": load_id}


# ─── INVOICE CRUD ─────────────────────────────────────────────────────────────

@app.get("/api/invoices")
def list_invoices(driver_id: Optional[str] = None, limit: int = 50, db: Session = Depends(get_db)):
    q = db.query(Invoice)
    if driver_id:
        q = q.filter(Invoice.driver_id == driver_id)
    invoices = q.order_by(Invoice.created_at.desc()).limit(limit).all()
    return [
        {
            "id": inv.id,
            "load_id": inv.load_id,
            "amount": inv.amount,
            "total": inv.total,
            "status": inv.status,
            "factoring_company": inv.factoring_company,
            "submitted_at": inv.submitted_at.isoformat() if inv.submitted_at else None,
            "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
            "created_at": inv.created_at.isoformat() if inv.created_at else None,
        }
        for inv in invoices
    ]


@app.get("/api/invoices/{invoice_id}")
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {
        "id": inv.id,
        "load_id": inv.load_id,
        "driver_id": inv.driver_id,
        "amount": inv.amount,
        "fuel_surcharge": inv.fuel_surcharge,
        "total": inv.total,
        "status": inv.status,
        "factoring_company": inv.factoring_company,
        "bol_text": inv.bol_text,
        "submitted_at": inv.submitted_at.isoformat() if inv.submitted_at else None,
        "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
    }


# ─── AGENT LOGS ───────────────────────────────────────────────────────────────

@app.get("/api/logs")
def list_logs(driver_id: Optional[str] = None, limit: int = 100, db: Session = Depends(get_db)):
    q = db.query(AgentLog)
    if driver_id:
        q = q.filter(AgentLog.driver_id == driver_id)
    logs = q.order_by(AgentLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "agent_name": log.agent_name,
            "crew_name": log.crew_name,
            "success": log.success,
            "duration_ms": log.duration_ms,
            "error": log.error,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]
