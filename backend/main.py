"""
main.py — Prince Haul Intelligence (PHI) FastAPI Application

REST API connecting the PHI mobile app frontend to the 15-agent CrewAI backend.
Every endpoint triggers a multi-agent workflow and returns either a synchronous
result or a job_id for async polling.

Endpoint map:
  GET  /                              → Service health and version
  GET  /health                        → Health check (uptime monitor target)
  GET  /api/v1/agents                 → List all 15 agents with role summaries
  GET  /api/v1/agents/{group}         → Agents filtered by functional group

  POST /api/v1/autonomous-booking     → Workflow 1: Load Acquisition (async)
  POST /api/v1/autonomous-booking/sync → Workflow 1: Load Acquisition (sync, testing only)

  POST /api/v1/active-transit         → Workflow 2: Dispatch & Transit (async)
  POST /api/v1/active-transit/sync    → Workflow 2: Dispatch & Transit (sync, testing only)

  POST /api/v1/post-delivery          → Workflow 3: Post-Delivery Close (async)
  POST /api/v1/post-delivery/sync     → Workflow 3: Post-Delivery Close (sync, testing only)

  GET  /api/v1/jobs/{job_id}          → Poll async job status
  GET  /api/v1/jobs                   → List all jobs (paginated)

  PUT  /api/v1/drivers/{id}/fcm-token → Register driver FCM device token
  POST /api/v1/notifications/load-locked  → Push: Freight Negotiator locked a load
  POST /api/v1/notifications/hos-alert    → Push: HOS violation detected
  POST /api/v1/notifications/emergency    → Push: Breakdown / OTR crisis alert

  WS   /ws/{driver_id}                → Live agent activity, GPS/ETA, in-cab AI chat

Production note: Replace the in-memory _job_store dict with Redis + Celery or
ARQ for persistent, scalable async job management.
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Any
from enum import Enum

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv

from tasks import (
    build_load_acquisition_crew,
    build_dispatch_transit_crew,
    build_post_delivery_crew,
)
from agents import ALL_AGENTS, AGENT_GROUPS
from app.websocket_manager import manager as ws_manager
from app.database import SessionLocal, set_fcm_token, get_fcm_token

try:
    from services.push import notify_load_locked, notify_hos_violation, notify_emergency
    _PUSH_AVAILABLE = True
except ImportError:
    _PUSH_AVAILABLE = False

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("phi.api")

# ─── APPLICATION SETUP ────────────────────────────────────────────────────────

app = FastAPI(
    title="Prince Haul Intelligence API",
    description=(
        "Fully autonomous 15-agent AI backend for trucking owner-operators. "
        "Powers the PHI mobile app's Find Freight, Start Trip, and One-Tap Payday workflows."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "Q-Empire Automation Division",
        "email": "tech@q-empire.io",
    },
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store. Replace with Redis in production.
_job_store: dict[str, dict[str, Any]] = {}


@app.on_event("startup")
async def _startup() -> None:
    import asyncio
    from app.database import init_db

    # Ensure all SQLAlchemy tables exist (SQLite dev + bare Postgres without schema.sql).
    init_db()
    # CrewAI task_callback fires from a worker thread; capture the main event loop
    # so broadcast_to_driver_sync can hop back onto it.
    ws_manager.bind_loop(asyncio.get_running_loop())


# ═══════════════════════════════════════════════════════════════════════════════
# PYDANTIC REQUEST/RESPONSE MODELS
# All data entering the API is validated against these models before any
# crew workflow is triggered. Invalid input returns HTTP 422 with field details.
# ═══════════════════════════════════════════════════════════════════════════════

class EquipmentType(str, Enum):
    DRY_VAN = "Dry Van"
    REEFER = "Reefer"
    FLATBED = "Flatbed"
    STEP_DECK = "Step Deck"
    LOWBOY = "Lowboy"
    TANKER = "Tanker"
    CURTAIN_SIDE = "Curtain Side"


class SubscriptionTier(str, Enum):
    SOLO = "Solo"
    FLEET = "Fleet"
    ENTERPRISE = "Enterprise"


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


# ── Workflow 1 Request Model ──────────────────────────────────────────────────

class FreightSearchRequest(BaseModel):
    """
    Input model for the Autonomous Load Acquisition workflow.
    Defines driver preferences used by the freight_negotiator to target the right loads.
    """
    driver_id: str = Field(
        description="Unique driver identifier (UUID or custom ID)"
    )
    equipment_type: EquipmentType = Field(
        default=EquipmentType.DRY_VAN,
        description="Type of trailer the driver operates"
    )
    min_rpm: float = Field(
        default=3.00,
        ge=1.00,
        le=15.00,
        description="Minimum acceptable revenue per mile (e.g., 3.00 = $3.00/mile)"
    )
    preferred_states: list[str] = Field(
        default_factory=list,
        description="2-letter state codes to prioritize (e.g., ['TX', 'FL', 'GA'])"
    )
    avoid_states: list[str] = Field(
        default_factory=list,
        description="2-letter state codes to exclude from search"
    )
    home_city: str = Field(default="", description="Driver's home base city")
    home_state: str = Field(default="", description="Driver's home base state (2-letter)")
    available_date: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).date().isoformat(),
        description="ISO date of first available pickup (YYYY-MM-DD)"
    )
    max_deadhead_miles: int = Field(
        default=150,
        ge=0,
        le=500,
        description="Maximum miles willing to drive empty to reach pickup"
    )
    subscription_tier: SubscriptionTier = Field(
        default=SubscriptionTier.SOLO,
        description="Driver's PHI subscription tier"
    )

    @field_validator("preferred_states", "avoid_states")
    @classmethod
    def validate_state_codes(cls, v: list[str]) -> list[str]:
        valid = {
            "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
            "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
            "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
            "VA","WA","WV","WI","WY",
        }
        invalid = [s.upper() for s in v if s.upper() not in valid]
        if invalid:
            raise ValueError(f"Invalid state codes: {invalid}")
        return [s.upper() for s in v]


# ── Workflow 2 Request Models ─────────────────────────────────────────────────

class LoadDetail(BaseModel):
    """A fully booked load that the driver has accepted."""
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Rate confirmation number or internal load ID"
    )
    origin_city: str = Field(description="Pickup city")
    origin_state: str = Field(description="Pickup state (2-letter)")
    destination_city: str = Field(description="Delivery city")
    destination_state: str = Field(description="Delivery state (2-letter)")
    rate: float = Field(gt=0, description="Agreed total freight charge in USD")
    miles: int = Field(gt=0, description="Total loaded miles")
    pickup_date: str = Field(description="Scheduled pickup date (YYYY-MM-DD)")
    delivery_date: str = Field(description="Scheduled delivery date (YYYY-MM-DD)")
    broker_name: str = Field(description="Broker company name")
    broker_contact: str = Field(default="", description="Broker dispatch phone or email")
    equipment_type: EquipmentType = Field(default=EquipmentType.DRY_VAN)
    special_requirements: str = Field(default="", description="Any special load instructions")

    @property
    def origin(self) -> str:
        return f"{self.origin_city}, {self.origin_state}"

    @property
    def destination(self) -> str:
        return f"{self.destination_city}, {self.destination_state}"

    @property
    def rpm(self) -> float:
        return round(self.rate / self.miles, 2) if self.miles > 0 else 0.0


class DriverStatus(BaseModel):
    """Current real-time status of the driver and truck."""
    driver_id: str
    current_city: str
    current_state: str
    current_lat: float = Field(default=0.0, description="GPS latitude")
    current_lng: float = Field(default=0.0, description="GPS longitude")
    hos_remaining_drive: float = Field(
        default=11.0,
        ge=0.0,
        le=11.0,
        description="Hours of drive time remaining under current 11-hour rule"
    )
    hos_remaining_duty: float = Field(
        default=14.0,
        ge=0.0,
        le=14.0,
        description="Hours of on-duty time remaining under 14-hour window"
    )
    odometer: int = Field(default=0, ge=0, description="Current truck odometer in miles")

    @property
    def current_location(self) -> str:
        return f"{self.current_city}, {self.current_state}"


class DispatchRequest(BaseModel):
    """Full dispatch request: the accepted load plus the driver's current status."""
    load: LoadDetail
    driver: DriverStatus


# ── Workflow 3 Request Model ──────────────────────────────────────────────────

class DeliveryConfirmation(BaseModel):
    """
    Delivery confirmation payload — submitted when the driver uploads the signed BOL.
    Triggers invoice generation, tax logging, and maintenance update.
    """
    load_id: str = Field(description="Rate confirmation / load number")
    driver_id: str = Field(description="Driver's unique identifier")
    bol_text: str = Field(
        description=(
            "OCR-extracted text from the signed Bill of Lading photo. "
            "Include all visible text: shipper, consignee, commodity, weight, "
            "PO numbers, and driver signature confirmation."
        )
    )
    agreed_rate: float = Field(gt=0, description="Agreed total freight charge in USD")
    miles: int = Field(gt=0, description="Total loaded miles on this run")
    fuel_cost: float = Field(default=0.0, ge=0, description="Actual diesel cost spent on this load")
    toll_cost: float = Field(default=0.0, ge=0, description="Actual toll charges on this load")
    origin: str = Field(description="Pickup location (City, ST)")
    destination: str = Field(description="Delivery location (City, ST)")
    delivery_date: str = Field(description="Actual delivery date (YYYY-MM-DD)")
    broker_name: str
    factoring_company: str = Field(
        default="OTR Capital",
        description="Factoring company to submit invoice to"
    )
    factoring_email: str = Field(
        default="",
        description="Factoring company's invoice submission email (e.g. invoices@otrcapital.com)"
    )
    days_on_road: int = Field(
        default=1,
        ge=0,
        description="Number of nights away from home (drives per diem calculation)"
    )
    states_driven: list[str] = Field(
        default_factory=list,
        description="State codes driven through on this load (for IFTA reporting)"
    )


# ── Response Models ───────────────────────────────────────────────────────────

class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    workflow: str
    result: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None
    duration_seconds: Optional[float] = None


class AgentInfo(BaseModel):
    number: int
    name: str
    role: str
    group: str
    goal_preview: str
    allow_delegation: bool


class WorkflowStarted(BaseModel):
    job_id: str
    status: str = "running"
    workflow: str
    message: str
    poll_url: str


# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def _create_job(workflow: str) -> str:
    """Initialize a new job record and return its job_id."""
    job_id = str(uuid.uuid4())
    _job_store[job_id] = {
        "job_id": job_id,
        "status": JobStatus.RUNNING,
        "workflow": workflow,
        "result": None,
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
        "duration_seconds": None,
    }
    return job_id


def _complete_job(job_id: str, result: str, start_time: datetime) -> None:
    """Mark a job as completed with its result and duration."""
    end_time = datetime.now(timezone.utc)
    _job_store[job_id].update({
        "status": JobStatus.COMPLETED,
        "result": result,
        "completed_at": end_time.isoformat(),
        "duration_seconds": (end_time - start_time).total_seconds(),
    })


def _fail_job(job_id: str, error: str, start_time: datetime) -> None:
    """Mark a job as failed with the error message and duration."""
    end_time = datetime.now(timezone.utc)
    _job_store[job_id].update({
        "status": JobStatus.FAILED,
        "error": error,
        "completed_at": end_time.isoformat(),
        "duration_seconds": (end_time - start_time).total_seconds(),
    })


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/", tags=["system"], summary="Service root")
def root():
    """Returns service identity and basic health stats."""
    return {
        "service": "Prince Haul Intelligence API",
        "tagline": "Autonomous AI Backbone for Owner-Operator Trucking",
        "version": "2.0.0",
        "status": "online",
        "total_agents": len(ALL_AGENTS),
        "total_workflows": 3,
        "revenue_target": "$1,000,000 by December 31, 2026",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "docs_url": "/docs",
    }


@app.get("/health", tags=["system"], summary="Health check")
def health_check():
    """Minimal health check endpoint for uptime monitoring and load balancers."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "active_jobs": sum(1 for j in _job_store.values() if j["status"] == JobStatus.RUNNING),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/api/v1/agents",
    response_model=list[AgentInfo],
    tags=["agents"],
    summary="List all 15 agents",
)
def list_all_agents():
    """
    Returns all 15 PHI agents with their number, role, functional group,
    goal summary, and delegation capability.
    """
    group_map: dict[str, str] = {}
    for group_name, agents in AGENT_GROUPS.items():
        for agent in agents:
            group_map[agent.role] = group_name

    return [
        AgentInfo(
            number=i + 1,
            name=agent.role,
            role=agent.role,
            group=group_map.get(agent.role, "Unknown"),
            goal_preview=agent.goal[:140] + "..." if len(agent.goal) > 140 else agent.goal,
            allow_delegation=agent.allow_delegation,
        )
        for i, agent in enumerate(ALL_AGENTS)
    ]


@app.get(
    "/api/v1/agents/groups",
    tags=["agents"],
    summary="List agents by functional group",
)
def list_agents_by_group():
    """Returns all agents organized by their functional group."""
    result = {}
    for group_name, agents in AGENT_GROUPS.items():
        result[group_name] = [
            {"role": agent.role, "goal_preview": agent.goal[:100] + "..."}
            for agent in agents
        ]
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# JOB STATUS ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/api/v1/jobs/{job_id}",
    response_model=JobResponse,
    tags=["jobs"],
    summary="Poll async job status",
)
def get_job(job_id: str):
    """
    Poll the status of a background crew workflow job.
    Returns status, result (when complete), error (if failed), and duration.
    """
    job = _job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return JobResponse(**job)


@app.get(
    "/api/v1/jobs",
    response_model=list[JobResponse],
    tags=["jobs"],
    summary="List all jobs",
)
def list_jobs(
    status: Optional[JobStatus] = Query(default=None, description="Filter by status"),
    workflow: Optional[str] = Query(default=None, description="Filter by workflow name"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """List all crew workflow jobs with optional filtering and pagination."""
    jobs = list(_job_store.values())

    if status:
        jobs = [j for j in jobs if j["status"] == status]
    if workflow:
        jobs = [j for j in jobs if j.get("workflow") == workflow]

    jobs.sort(key=lambda j: j["created_at"], reverse=True)
    return [JobResponse(**j) for j in jobs[offset : offset + limit]]


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW 1 — AUTONOMOUS LOAD ACQUISITION
# Agents: freight_negotiator → insurance_assessor → legal_auditor
#       → freight_negotiator (negotiate) → compliance_officer
# ═══════════════════════════════════════════════════════════════════════════════

@app.post(
    "/api/v1/autonomous-booking",
    response_model=WorkflowStarted,
    tags=["workflows"],
    status_code=202,
    summary="Trigger Autonomous Load Acquisition (async)",
)
def autonomous_booking(request: FreightSearchRequest, background_tasks: BackgroundTasks):
    """
    **Workflow 1: Automated Load Acquisition**

    Triggers a 5-agent pipeline in the background:
    1. **FreightNegotiator** — scans load boards for top 15 candidate loads
    2. **InsuranceAssessor** — vets each load for broker, cargo, and route risk
    3. **LegalAuditor** — audits rate confirmation terms for predatory clauses
    4. **FreightNegotiator** — negotiates rate on top 3 cleared loads; books best RPM
    5. **ComplianceOfficer** — confirms driver HOS and qualification clearance

    Returns a `job_id`. Poll `GET /api/v1/jobs/{job_id}` for the result.
    Typical completion time: 4–12 minutes depending on load board response time.
    """
    job_id = _create_job("autonomous-booking")
    prefs = request.model_dump()
    start_time = datetime.now(timezone.utc)

    def _run_acquisition():
        try:
            logger.info(f"[autonomous-booking] Starting job {job_id} for driver {request.driver_id}")
            crew = build_load_acquisition_crew(prefs)
            result = crew.kickoff()
            _complete_job(job_id, str(result), start_time)
            logger.info(f"[autonomous-booking] Job {job_id} completed successfully")
        except Exception as exc:
            _fail_job(job_id, str(exc), start_time)
            logger.error(f"[autonomous-booking] Job {job_id} failed: {exc}", exc_info=True)

    background_tasks.add_task(_run_acquisition)
    return WorkflowStarted(
        job_id=job_id,
        workflow="autonomous-booking",
        message=(
            "Load acquisition workflow started. 5 agents are scanning, vetting, "
            "auditing contracts, and negotiating your next load."
        ),
        poll_url=f"/api/v1/jobs/{job_id}",
    )


@app.post(
    "/api/v1/autonomous-booking/sync",
    tags=["workflows"],
    summary="Trigger Autonomous Load Acquisition (sync — testing only)",
)
def autonomous_booking_sync(request: FreightSearchRequest):
    """
    **Synchronous version — for local testing only.**
    Blocks the HTTP request until all 5 agents complete (can take 4-12 minutes).
    Use the async endpoint `/api/v1/autonomous-booking` in production.
    """
    try:
        crew = build_load_acquisition_crew(request.model_dump())
        result = crew.kickoff()
        return {"status": "completed", "workflow": "autonomous-booking", "result": str(result)}
    except Exception as exc:
        logger.error(f"[autonomous-booking/sync] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW 2 — ACTIVE DISPATCH & TRANSIT
# Agents: route_optimizer → fuel_optimizer → dispatcher
#       → track_trace_agent → driver_liaison
# ═══════════════════════════════════════════════════════════════════════════════

@app.post(
    "/api/v1/active-transit",
    response_model=WorkflowStarted,
    tags=["workflows"],
    status_code=202,
    summary="Trigger Active Dispatch & Transit Workflow (async)",
)
def active_transit(request: DispatchRequest, background_tasks: BackgroundTasks):
    """
    **Workflow 2: Active Dispatch & Transit**

    Triggers a 5-agent pipeline in the background:
    1. **RouteOptimizer** — plots truck-legal route with all restrictions and HOS insertions
    2. **FuelOptimizer** — engineers fuel stop plan to minimize cost on the corridor
    3. **Dispatcher** — executes broker confirmation and sets up check-call schedule
    4. **TrackTraceLiaison** — arms automated monitoring from pickup through delivery
    5. **DriverLiaison** — compiles and delivers complete in-cab briefing packet

    Returns a `job_id`. Poll `GET /api/v1/jobs/{job_id}` for the full route, fuel plan,
    dispatch confirmation, and driver briefing.
    """
    job_id = _create_job("active-transit")
    start_time = datetime.now(timezone.utc)

    load_dict = {
        "id": request.load.id,
        "origin": request.load.origin,
        "destination": request.load.destination,
        "rate": request.load.rate,
        "miles": request.load.miles,
        "pickup_date": request.load.pickup_date,
        "delivery_date": request.load.delivery_date,
        "broker_name": request.load.broker_name,
        "broker_contact": request.load.broker_contact,
        "equipment_type": request.load.equipment_type,
        "special_requirements": request.load.special_requirements,
    }
    driver_dict = {
        "id": request.driver.driver_id,
        "current_location": request.driver.current_location,
        "current_lat": request.driver.current_lat,
        "current_lng": request.driver.current_lng,
        "hos_remaining_drive": request.driver.hos_remaining_drive,
        "hos_remaining_duty": request.driver.hos_remaining_duty,
        "odometer": request.driver.odometer,
    }

    def _run_transit():
        try:
            logger.info(
                f"[active-transit] Starting job {job_id} for load {request.load.id} "
                f"driver {request.driver.driver_id}"
            )
            crew = build_dispatch_transit_crew(load_dict, driver_dict)
            result = crew.kickoff()
            _complete_job(job_id, str(result), start_time)
            logger.info(f"[active-transit] Job {job_id} completed successfully")
        except Exception as exc:
            _fail_job(job_id, str(exc), start_time)
            logger.error(f"[active-transit] Job {job_id} failed: {exc}", exc_info=True)

    background_tasks.add_task(_run_transit)
    return WorkflowStarted(
        job_id=job_id,
        workflow="active-transit",
        message=(
            "Dispatch workflow started. Routing, fuel planning, broker dispatch, "
            "and in-cab briefing are being prepared by 5 agents."
        ),
        poll_url=f"/api/v1/jobs/{job_id}",
    )


@app.post(
    "/api/v1/active-transit/sync",
    tags=["workflows"],
    summary="Trigger Active Dispatch & Transit Workflow (sync — testing only)",
)
def active_transit_sync(request: DispatchRequest):
    """
    **Synchronous version — for local testing only.**
    Blocks the HTTP request until all 5 agents complete.
    """
    load_dict = {
        "id": request.load.id,
        "origin": request.load.origin,
        "destination": request.load.destination,
        "rate": request.load.rate,
        "miles": request.load.miles,
        "pickup_date": request.load.pickup_date,
        "delivery_date": request.load.delivery_date,
        "broker_name": request.load.broker_name,
        "broker_contact": request.load.broker_contact,
        "equipment_type": request.load.equipment_type,
        "special_requirements": request.load.special_requirements,
    }
    driver_dict = {
        "id": request.driver.driver_id,
        "current_location": request.driver.current_location,
        "current_lat": request.driver.current_lat,
        "current_lng": request.driver.current_lng,
        "hos_remaining_drive": request.driver.hos_remaining_drive,
        "hos_remaining_duty": request.driver.hos_remaining_duty,
        "odometer": request.driver.odometer,
    }
    try:
        crew = build_dispatch_transit_crew(load_dict, driver_dict)
        result = crew.kickoff()
        return {"status": "completed", "workflow": "active-transit", "result": str(result)}
    except Exception as exc:
        logger.error(f"[active-transit/sync] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW 3 — POST-DELIVERY FINANCIAL CLOSE
# Agents: finance_specialist → tax_auditor → maintenance_monitor → bi_executive
# ═══════════════════════════════════════════════════════════════════════════════

@app.post(
    "/api/v1/post-delivery",
    response_model=WorkflowStarted,
    tags=["workflows"],
    status_code=202,
    summary="Trigger Post-Delivery Financial Close Workflow (async)",
)
def post_delivery(confirmation: DeliveryConfirmation, background_tasks: BackgroundTasks):
    """
    **Workflow 3: One-Tap Payday (Post-Delivery Financial Close)**

    Triggers a 4-agent pipeline in the background:
    1. **FinanceSpecialist** — generates invoice from BOL + submits to factoring company
    2. **TaxAuditor** — logs all deductible expenses + updates IFTA mileage by state
    3. **MaintenanceMonitor** — updates service interval records + flags anything due soon
    4. **BIExecutive** — delivers daily P&L brief with YTD progress vs $1M target

    Returns a `job_id`. Poll `GET /api/v1/jobs/{job_id}` for the invoice number,
    factoring confirmation, expense log, and executive brief.

    Target: BOL upload to factoring advance in under 24 hours.
    """
    job_id = _create_job("post-delivery")
    delivery_dict = confirmation.model_dump()
    start_time = datetime.now(timezone.utc)

    def _run_post_delivery():
        try:
            logger.info(
                f"[post-delivery] Starting job {job_id} for load {confirmation.load_id} "
                f"driver {confirmation.driver_id}"
            )
            crew = build_post_delivery_crew(delivery_dict)
            result = crew.kickoff()
            _complete_job(job_id, str(result), start_time)
            logger.info(f"[post-delivery] Job {job_id} completed successfully")
        except Exception as exc:
            _fail_job(job_id, str(exc), start_time)
            logger.error(f"[post-delivery] Job {job_id} failed: {exc}", exc_info=True)

    background_tasks.add_task(_run_post_delivery)
    return WorkflowStarted(
        job_id=job_id,
        workflow="post-delivery",
        message=(
            "Post-delivery workflow started. Invoice is being generated, expenses logged, "
            "maintenance records updated, and your daily P&L brief is being prepared."
        ),
        poll_url=f"/api/v1/jobs/{job_id}",
    )


@app.post(
    "/api/v1/post-delivery/sync",
    tags=["workflows"],
    summary="Trigger Post-Delivery Workflow (sync — testing only)",
)
def post_delivery_sync(confirmation: DeliveryConfirmation):
    """
    **Synchronous version — for local testing only.**
    Blocks the HTTP request until all 4 agents complete.
    """
    try:
        crew = build_post_delivery_crew(confirmation.model_dump())
        result = crew.kickoff()
        return {"status": "completed", "workflow": "post-delivery", "result": str(result)}
    except Exception as exc:
        logger.error(f"[post-delivery/sync] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# DRIVER DEVICE MANAGEMENT & PUSH NOTIFICATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

class FCMTokenUpdate(BaseModel):
    token: str = Field(description="Firebase Cloud Messaging device registration token")


class LoadLockedPayload(BaseModel):
    driver_id: str
    load_id: str
    origin: str
    destination: str
    rpm: float = Field(gt=0)


class HOSAlertPayload(BaseModel):
    driver_id: str
    hours_remaining: float = Field(ge=0, le=11)
    violation_type: str = Field(default="11-Hour Driving Limit")


class EmergencyPayload(BaseModel):
    driver_id: str
    load_id: str
    summary: str = Field(description="Brief description of the breakdown or emergency")


@app.put(
    "/api/v1/drivers/{driver_id}/fcm-token",
    tags=["drivers"],
    summary="Register driver FCM device token",
)
def register_fcm_token(driver_id: str, body: FCMTokenUpdate):
    """
    Store the driver's Firebase Cloud Messaging device token so the backend
    can send push notifications to their phone. Call this on every app launch
    to handle token rotation.
    """
    db = SessionLocal()
    try:
        ok = set_fcm_token(db, driver_id, body.token)
    finally:
        db.close()

    if not ok:
        raise HTTPException(status_code=404, detail=f"Driver '{driver_id}' not found.")
    return {"status": "ok", "driver_id": driver_id, "token_registered": True}


@app.post(
    "/api/v1/notifications/load-locked",
    tags=["notifications"],
    summary="Push: Freight Negotiator locked a high-paying load",
)
def push_load_locked(payload: LoadLockedPayload):
    """
    Immediately push a 'load locked' alert to the driver's device.
    Called by the Freight Negotiator workflow after successfully booking a load,
    or triggered manually from an agent's tool.
    Requires a valid FCM device token registered via PUT /api/v1/drivers/{id}/fcm-token.
    """
    if not _PUSH_AVAILABLE:
        raise HTTPException(status_code=503, detail="Push notifications not configured (firebase-admin not installed).")

    db = SessionLocal()
    try:
        token = get_fcm_token(db, payload.driver_id)
    finally:
        db.close()

    if not token:
        raise HTTPException(
            status_code=404,
            detail=f"No FCM token found for driver '{payload.driver_id}'. "
                   "Register it with PUT /api/v1/drivers/{id}/fcm-token first.",
        )

    try:
        msg_id = notify_load_locked(
            token,
            load_id=payload.load_id,
            origin=payload.origin,
            destination=payload.destination,
            rpm=payload.rpm,
        )
    except Exception as exc:
        logger.error("FCM load-locked push failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"FCM delivery failed: {exc}")

    return {"status": "sent", "fcm_message_id": msg_id, "driver_id": payload.driver_id}


@app.post(
    "/api/v1/notifications/hos-alert",
    tags=["notifications"],
    summary="Push: Compliance Officer detected an HOS violation",
)
def push_hos_alert(payload: HOSAlertPayload):
    """
    Immediately push an Hours of Service (HOS) compliance alert to the driver.
    Called automatically from agent_events.py when the DOT Compliance Auditor
    flags a violation, or triggered manually from compliance monitoring tools.
    """
    if not _PUSH_AVAILABLE:
        raise HTTPException(status_code=503, detail="Push notifications not configured.")

    db = SessionLocal()
    try:
        token = get_fcm_token(db, payload.driver_id)
    finally:
        db.close()

    if not token:
        raise HTTPException(status_code=404, detail=f"No FCM token for driver '{payload.driver_id}'.")

    try:
        msg_id = notify_hos_violation(
            token,
            hours_remaining=payload.hours_remaining,
            violation_type=payload.violation_type,
        )
    except Exception as exc:
        logger.error("FCM HOS push failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"FCM delivery failed: {exc}")

    return {"status": "sent", "fcm_message_id": msg_id, "driver_id": payload.driver_id}


@app.post(
    "/api/v1/notifications/emergency",
    tags=["notifications"],
    summary="Push: Emergency Crisis Controller — breakdown or OTR crisis alert",
)
def push_emergency(payload: EmergencyPayload):
    """
    Immediately push a breakdown or over-the-road crisis alert to the driver.
    Called by the 24/7 Emergency Crisis Controller when a critical situation
    is detected (mechanical failure, accident, cargo issue, etc.).
    This endpoint fires as high-priority FCM — the driver's phone sounds an
    alert even in Do Not Disturb mode (subject to OS permissions).
    """
    if not _PUSH_AVAILABLE:
        raise HTTPException(status_code=503, detail="Push notifications not configured.")

    db = SessionLocal()
    try:
        token = get_fcm_token(db, payload.driver_id)
    finally:
        db.close()

    if not token:
        raise HTTPException(status_code=404, detail=f"No FCM token for driver '{payload.driver_id}'.")

    try:
        msg_id = notify_emergency(token, load_id=payload.load_id, summary=payload.summary)
    except Exception as exc:
        logger.error("FCM emergency push failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"FCM delivery failed: {exc}")

    logger.warning(
        "EMERGENCY ALERT sent to driver %s for load %s: %s",
        payload.driver_id, payload.load_id, payload.summary,
    )
    return {"status": "sent", "fcm_message_id": msg_id, "driver_id": payload.driver_id}


# ═══════════════════════════════════════════════════════════════════════════════
# WEBSOCKET — LIVE AGENT ACTIVITY, GPS/ETA, AND IN-CAB AI CHAT
# Persistent per-driver channel. The Driver Liaison and Track & Trace agents
# (and the task_callback hooks in tasks.py) push events here as they happen —
# REST polling can't keep up with live GPS pings or in-cab chat latency.
# ═══════════════════════════════════════════════════════════════════════════════

@app.websocket("/ws/{driver_id}")
async def driver_websocket(websocket: WebSocket, driver_id: str):
    await ws_manager.connect(driver_id, websocket)
    try:
        while True:
            # Mobile client may send chat messages or location pings; for now
            # we just echo an ack so the connection round-trips end to end.
            data = await websocket.receive_json()
            await ws_manager.broadcast_to_driver(
                driver_id,
                {"type": "ack", "received": data.get("type", "unknown")},
            )
    except WebSocketDisconnect:
        ws_manager.disconnect(driver_id, websocket)


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2 — AGENT MAP
# ═══════════════════════════════════════════════════════════════════════════════

class AgentEdge(BaseModel):
    from_agent: str = Field(description="Source agent role")
    to_agent: str = Field(description="Destination agent role")
    label: str = Field(description="Work passing along this edge")


class AgentMapNode(BaseModel):
    id: str
    role: str
    group: str
    status: str = Field(default="idle", description="idle | running | done | error")
    tasks_today: int = Field(default=0)


class AgentMapResponse(BaseModel):
    nodes: list[AgentMapNode]
    edges: list[AgentEdge]
    active_jobs: int


# In-memory agent status — updated by task callbacks in tasks.py
_agent_status: dict[str, str] = {}


@app.get(
    "/api/v1/agent-map",
    response_model=AgentMapResponse,
    tags=["agents"],
    summary="Live agent orchestration map",
)
def get_agent_map():
    """
    Returns the full agent DAG with current status of each node.
    Used by the Mission Control screen to render the live orchestration diagram.
    """
    group_map: dict[str, str] = {}
    for group_name, agents in AGENT_GROUPS.items():
        for agent in agents:
            group_map[agent.role] = group_name

    nodes = [
        AgentMapNode(
            id=agent.role.lower().replace(" ", "-"),
            role=agent.role,
            group=group_map.get(agent.role, "Unknown"),
            status=_agent_status.get(agent.role, "idle"),
        )
        for agent in ALL_AGENTS
    ]

    edges = [
        AgentEdge(from_agent="Freight Negotiator", to_agent="Insurance Assessor", label="load candidates"),
        AgentEdge(from_agent="Insurance Assessor", to_agent="Legal Auditor", label="risk-vetted loads"),
        AgentEdge(from_agent="Legal Auditor", to_agent="Freight Negotiator", label="cleared contracts"),
        AgentEdge(from_agent="Freight Negotiator", to_agent="Compliance Officer", label="booked load"),
        AgentEdge(from_agent="Route Optimizer", to_agent="Fuel Optimizer", label="planned route"),
        AgentEdge(from_agent="Fuel Optimizer", to_agent="Dispatcher", label="optimized stops"),
        AgentEdge(from_agent="Dispatcher", to_agent="Track & Trace Agent", label="trip underway"),
        AgentEdge(from_agent="Track & Trace Agent", to_agent="Driver Liaison", label="live ETA"),
        AgentEdge(from_agent="Driver Liaison", to_agent="Finance Specialist", label="delivery confirmed"),
        AgentEdge(from_agent="Finance Specialist", to_agent="Tax Auditor", label="invoice"),
        AgentEdge(from_agent="Tax Auditor", to_agent="BI Executive", label="P&L data"),
        AgentEdge(from_agent="Maintenance Monitor", to_agent="BI Executive", label="service records"),
    ]

    active_jobs = sum(1 for j in _job_store.values() if j["status"] == JobStatus.RUNNING)

    return AgentMapResponse(nodes=nodes, edges=edges, active_jobs=active_jobs)


@app.websocket("/ws/agent-status")
async def agent_status_ws(websocket: WebSocket):
    """
    WebSocket channel that pushes real-time agent status updates.
    The mobile Mission Control screen subscribes here to animate node state changes.
    """
    await websocket.accept()
    try:
        while True:
            import asyncio
            await asyncio.sleep(2)
            await websocket.send_json({
                "type": "agent_status_update",
                "statuses": _agent_status,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
    except WebSocketDisconnect:
        pass


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3 — LOAD BOARD ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

class LoadLocation(BaseModel):
    city: str
    state: str
    latitude: float
    longitude: float


class LoadPost(BaseModel):
    """Request body for posting a new load (broker board)."""
    broker_name: str = Field(description="Posting broker or shipper name")
    equipment_type: EquipmentType = Field(default=EquipmentType.DRY_VAN)
    origin_city: str
    origin_state: str
    origin_lat: float
    origin_lng: float
    destination_city: str
    destination_state: str
    rate: float = Field(ge=100, description="All-in rate in USD")
    total_miles: int = Field(ge=1)
    pickup_date: str = Field(description="ISO date YYYY-MM-DD")
    weight_lbs: int = Field(default=40000, ge=1, le=80000)
    notes: str = Field(default="")


class LoadPostResponse(BaseModel):
    load_id: str
    status: str
    message: str


# In-memory load store for broker board posts
_broker_loads: list[dict] = []


@app.post(
    "/api/v1/loads",
    response_model=LoadPostResponse,
    tags=["loads"],
    status_code=201,
    summary="Post a load to the broker board",
)
async def post_load(load: LoadPost):
    """
    Allows a broker or shipper to post a load directly to the PHI broker board.
    Returns a load_id that drivers can use to accept the load.
    """
    load_id = f"PHI-{uuid.uuid4().hex[:8].upper()}"
    record = {"load_id": load_id, **load.model_dump(), "posted_at": datetime.now(timezone.utc).isoformat(), "status": "open"}
    _broker_loads.append(record)
    logger.info(f"New broker load posted: {load_id}")
    return LoadPostResponse(load_id=load_id, status="open", message=f"Load {load_id} is live on the broker board.")


@app.get(
    "/api/v1/loads",
    tags=["loads"],
    summary="Get broker board loads",
)
async def get_loads(
    equipment_type: Optional[str] = Query(default=None),
    min_rpm: Optional[float] = Query(default=None, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
):
    """Returns loads posted on the broker board, with optional filtering."""
    loads = [l for l in _broker_loads if l["status"] == "open"]
    if equipment_type:
        loads = [l for l in loads if l["equipment_type"] == equipment_type]
    if min_rpm is not None:
        loads = [l for l in loads if l["rate"] / max(l["total_miles"], 1) >= min_rpm]
    return {"loads": loads[:limit], "total": len(loads)}


@app.put(
    "/api/v1/loads/{load_id}/accept",
    tags=["loads"],
    summary="Accept / book a load from the broker board",
)
async def accept_load(load_id: str, driver_id: str = Query(description="Driver accepting the load")):
    """Marks a broker-board load as accepted by the given driver."""
    for load in _broker_loads:
        if load["load_id"] == load_id:
            if load["status"] != "open":
                raise HTTPException(status_code=409, detail="Load is no longer available.")
            load["status"] = "accepted"
            load["accepted_by"] = driver_id
            load["accepted_at"] = datetime.now(timezone.utc).isoformat()
            logger.info(f"Load {load_id} accepted by driver {driver_id}")
            return {"load_id": load_id, "status": "accepted", "message": "Load booked successfully."}
    raise HTTPException(status_code=404, detail=f"Load {load_id} not found.")


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 5 — CO-DRIVER / FIND-A-DRIVER ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

class DriverLocationUpdate(BaseModel):
    driver_id: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    cdl_class: str = Field(default="A")
    available: bool = Field(default=True)
    looking_for_codriver: bool = Field(default=False)
    name: str = Field(default="PHI Driver")
    rating: float = Field(default=5.0, ge=1.0, le=5.0)


class CoDriverRequest(BaseModel):
    requester_driver_id: str
    target_driver_id: str
    split_percentage: int = Field(ge=1, le=99, description="Requester's revenue share %")
    load_id: Optional[str] = Field(default=None)


# In-memory driver presence (replace with Redis in production)
_driver_locations: dict[str, dict] = {}


@app.put(
    "/api/v1/drivers/{driver_id}/location",
    tags=["drivers"],
    summary="Update driver location and availability",
)
async def update_driver_location(driver_id: str, update: DriverLocationUpdate):
    """Registers or updates a driver's position and co-driver availability status."""
    _driver_locations[driver_id] = {
        **update.model_dump(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    return {"status": "ok", "driver_id": driver_id}


@app.get(
    "/api/v1/drivers/nearby",
    tags=["drivers"],
    summary="Find co-drivers within radius",
)
async def get_nearby_drivers(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    radius_miles: float = Query(default=50, ge=1, le=500),
    looking_for_codriver: bool = Query(default=False, description="Only return drivers seeking a team partner"),
):
    """
    Returns drivers within the specified radius of the given coordinates.
    Uses Haversine formula for distance calculation.
    """
    import math

    def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 3958.8  # Earth radius in miles
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    nearby = []
    for d_id, data in _driver_locations.items():
        dist = haversine(latitude, longitude, data["latitude"], data["longitude"])
        if dist <= radius_miles:
            if looking_for_codriver and not data.get("looking_for_codriver", False):
                continue
            nearby.append({**data, "distance_miles": round(dist, 1)})

    nearby.sort(key=lambda d: d["distance_miles"])
    return {"drivers": nearby, "count": len(nearby), "radius_miles": radius_miles}


@app.post(
    "/api/v1/codriver/request",
    tags=["drivers"],
    status_code=201,
    summary="Send a co-driver request",
)
async def send_codriver_request(request: CoDriverRequest):
    """
    Sends a co-driver request from one driver to another with proposed revenue split.
    In production, this triggers a push notification to the target driver.
    """
    if request.requester_driver_id not in _driver_locations:
        raise HTTPException(status_code=404, detail="Requester driver not found. Update your location first.")
    if request.target_driver_id not in _driver_locations:
        raise HTTPException(status_code=404, detail="Target driver not found.")

    request_id = f"CDR-{uuid.uuid4().hex[:8].upper()}"
    logger.info(
        f"Co-driver request {request_id}: {request.requester_driver_id} → "
        f"{request.target_driver_id} ({request.split_percentage}/{100 - request.split_percentage} split)"
    )
    return {
        "request_id": request_id,
        "status": "pending",
        "message": f"Request sent. Split: {request.split_percentage}% / {100 - request.split_percentage}%",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 7 — DISPATCH RADIO ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

class RadioBroadcast(BaseModel):
    channel: int = Field(description="CB channel number (1, 9, 19, etc.)")
    speaker: str = Field(default="Dispatcher", description="Broadcaster name")
    message: str = Field(description="Message to broadcast")
    tts: bool = Field(default=True, description="Whether to read via TTS on client")


_radio_history: list[dict] = []


@app.post(
    "/api/v1/radio/broadcast",
    tags=["radio"],
    status_code=201,
    summary="Broadcast a message on a dispatch radio channel",
)
async def radio_broadcast(broadcast: RadioBroadcast):
    """
    Posts a message to a radio channel. All connected drivers on that channel
    receive the message via the WebSocket stream. Supports AI dispatch TTS reads.
    """
    entry = {
        "id": uuid.uuid4().hex,
        "channel": broadcast.channel,
        "speaker": broadcast.speaker,
        "message": broadcast.message,
        "tts": broadcast.tts,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _radio_history.append(entry)
    # Keep last 1000 transmissions per channel in memory
    if len(_radio_history) > 1000:
        _radio_history.pop(0)

    # Broadcast to all connected WebSocket clients
    await ws_manager.broadcast_to_all({"type": "radio_message", **entry})

    logger.info(f"Radio CH{broadcast.channel} [{broadcast.speaker}]: {broadcast.message[:60]}")
    return {"status": "broadcast", "id": entry["id"], "channel": broadcast.channel}


@app.get(
    "/api/v1/radio/history",
    tags=["radio"],
    summary="Get radio channel history (last 100 transmissions)",
)
async def get_radio_history(channel: Optional[int] = Query(default=None)):
    """Returns the last 100 transmissions for a given channel, or all channels if omitted."""
    history = _radio_history
    if channel is not None:
        history = [h for h in history if h["channel"] == channel]
    return {"history": history[-100:], "total": len(history)}


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4 — BUSINESS LAUNCH TOOLKIT ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

class BusinessChecklistItem(BaseModel):
    id: str
    phase: str
    title: str
    description: str
    cost: str
    required: bool = False
    category: str = Field(description="legal | authority | insurance | compliance | banking | equipment")


class BusinessChecklistResponse(BaseModel):
    total_items: int
    phases: int
    estimated_startup_cost_min: int
    estimated_startup_cost_max: int
    items: list[BusinessChecklistItem]


BUSINESS_CHECKLIST_ITEMS: list[BusinessChecklistItem] = [
    # Phase 1 — Legal
    BusinessChecklistItem(id="ein", phase="legal", title="Get Federal EIN", description="Apply free at IRS.gov. Required to open a business bank account.", cost="Free", required=True, category="legal"),
    BusinessChecklistItem(id="llc", phase="legal", title="File LLC", description="File Articles of Organization with your state's Secretary of State.", cost="$50–$500", required=True, category="legal"),
    BusinessChecklistItem(id="bank", phase="legal", title="Open Business Bank Account", description="Keep business and personal money separate. Use Relay or Mercury.", cost="Free", category="legal"),
    # Phase 2 — Authority
    BusinessChecklistItem(id="usdot", phase="authority", title="Get USDOT Number", description="Register free at FMCSA.dot.gov. Required for interstate commerce.", cost="Free", required=True, category="authority"),
    BusinessChecklistItem(id="mc", phase="authority", title="Apply for MC Authority", description="$300 one-time fee. Takes 20-25 business days to activate.", cost="$300", required=True, category="authority"),
    BusinessChecklistItem(id="boc3", phase="authority", title="File BOC-3", description="Designate a process agent. Required before MC activates.", cost="$20–$40", required=True, category="authority"),
    # Phase 3 — Insurance
    BusinessChecklistItem(id="liability", phase="insurance", title="Primary Liability Insurance ($750K min)", description="Required by FMCSA before MC authority activates.", cost="$800–$2,000/mo", required=True, category="insurance"),
    BusinessChecklistItem(id="cargo", phase="insurance", title="Cargo Insurance ($100K min)", description="Covers the freight you haul. Most brokers require this.", cost="$150–$400/mo", required=True, category="insurance"),
    # Phase 4 — Compliance
    BusinessChecklistItem(id="ucr", phase="compliance", title="UCR Registration", description="Annual fee. Register at ucr.gov before Jan 1 each year.", cost="$59–$90/year", required=True, category="compliance"),
    BusinessChecklistItem(id="irp", phase="compliance", title="IRP Apportioned Plates", description="Interstate license plates from your state DMV.", cost="$1,500–$2,500/year", required=True, category="compliance"),
    BusinessChecklistItem(id="ifta", phase="compliance", title="IFTA Registration", description="Quarterly fuel tax reporting across state lines.", cost="Free to register", required=True, category="compliance"),
    BusinessChecklistItem(id="eld", phase="compliance", title="ELD Device", description="Federally required for HOS compliance. Use Motive or Samsara.", cost="$35–$60/mo", required=True, category="compliance"),
    # Phase 5 — Banking
    BusinessChecklistItem(id="factoring", phase="banking", title="Set Up Freight Factoring", description="Get paid same-day instead of waiting 30-90 days.", cost="2–5% fee per invoice", category="banking"),
    BusinessChecklistItem(id="fuel-card", phase="banking", title="Fuel Card", description="EFS or Comdata for $0.10–$0.40/gallon discounts.", cost="Free", category="banking"),
    # Phase 6 — Equipment
    BusinessChecklistItem(id="load-board", phase="equipment", title="Load Board Access", description="DAT, Truckstop, or use PHI's built-in 5-board aggregator.", cost="$0–$120/mo", required=True, category="equipment"),
    BusinessChecklistItem(id="phi-workers", phase="equipment", title="Activate PHI AI Workers", description="10 AI agents handle dispatch, compliance, invoicing automatically.", cost="Included with PHI", required=False, category="equipment"),
]


@app.get(
    "/api/v1/business-checklist",
    response_model=BusinessChecklistResponse,
    tags=["business"],
    summary="Get the owner-operator startup checklist",
)
async def get_business_checklist(
    category: Optional[str] = Query(default=None, description="Filter by: legal | authority | insurance | compliance | banking | equipment"),
):
    """
    Returns the complete step-by-step checklist to launch a trucking business.
    Covers LLC, USDOT, MC authority, insurance, IFTA, IRP, UCR, ELD, and more.
    """
    items = BUSINESS_CHECKLIST_ITEMS
    if category:
        items = [i for i in items if i.category == category]
    return BusinessChecklistResponse(
        total_items=len(items),
        phases=len({i.phase for i in items}),
        estimated_startup_cost_min=5000,
        estimated_startup_cost_max=8000,
        items=items,
    )


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 8 — DRIVER COMMUNITY FEED ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

class FeedPostType(str, Enum):
    TIP = "tip"
    ALERT = "alert"
    FUEL = "fuel"
    GENERAL = "general"
    WEIGH_STATION = "weigh_station"


class NewFeedPost(BaseModel):
    author_id: str
    author_name: str
    author_city: str = Field(default="")
    author_state: str = Field(default="")
    post_type: FeedPostType = Field(default=FeedPostType.GENERAL)
    content: str = Field(min_length=1, max_length=500)
    location_tag: Optional[str] = Field(default=None)


class FeedReaction(BaseModel):
    post_id: str
    driver_id: str
    reaction: str = Field(description="One of: 🚛 💰 ⭐ 🔥 ✅")


class FeedPostResponse(BaseModel):
    id: str
    author_id: str
    author_name: str
    author_city: str
    author_state: str
    post_type: str
    content: str
    time_ago: str
    reactions: dict
    comment_count: int
    location_tag: Optional[str]
    created_at: str


# In-memory feed (replace with PostgreSQL in production)
_feed_posts: list[dict] = [
    {
        "id": "p1", "author_id": "seed-1", "author_name": "Big Mike T.",
        "author_city": "Dallas", "author_state": "TX",
        "post_type": "tip", "content": "DAT rates on the TX→GA lane just jumped $0.30/mile. Lock in a load before EOD if you're in the DFW area.",
        "time_ago": "2h ago", "reactions": {"🚛": 14, "💰": 22, "⭐": 0, "🔥": 8, "✅": 5},
        "comment_count": 7, "location_tag": "Dallas, TX",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "p2", "author_id": "seed-2", "author_name": "Sandra Lee",
        "author_city": "Memphis", "author_state": "TN",
        "post_type": "weigh_station", "content": "I-40 weigh station at mile marker 162 in TN is running full inspection today. Allow extra time.",
        "time_ago": "4h ago", "reactions": {"🚛": 31, "💰": 0, "⭐": 0, "🔥": 2, "✅": 18},
        "comment_count": 12, "location_tag": "I-40 TN MM 162",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
    {
        "id": "p3", "author_id": "seed-3", "author_name": "Carlos M.",
        "author_city": "Houston", "author_state": "TX",
        "post_type": "fuel", "content": "Love's Travel Stop on I-10 West near San Antonio has diesel at $3.68 — cheapest I've seen all week.",
        "time_ago": "6h ago", "reactions": {"🚛": 9, "💰": 18, "⭐": 0, "🔥": 11, "✅": 6},
        "comment_count": 3, "location_tag": "I-10 San Antonio TX",
        "created_at": datetime.now(timezone.utc).isoformat(),
    },
]


@app.get(
    "/api/v1/community/feed",
    response_model=list[FeedPostResponse],
    tags=["community"],
    summary="Get community driver feed",
)
async def get_community_feed(
    post_type: Optional[str] = Query(default=None, description="Filter by: tip | alert | fuel | general | weigh_station"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """
    Returns the latest posts from the driver community feed.
    Includes road tips, fuel prices, weigh station alerts, and general driver chatter.
    """
    posts = list(reversed(_feed_posts))  # Newest first
    if post_type:
        posts = [p for p in posts if p["post_type"] == post_type]
    page = posts[offset:offset + limit]
    return [FeedPostResponse(**p) for p in page]


@app.post(
    "/api/v1/community/feed",
    response_model=FeedPostResponse,
    tags=["community"],
    status_code=201,
    summary="Post to the driver community feed",
)
async def create_feed_post(post: NewFeedPost):
    """Creates a new post on the community driver feed."""
    new_post = {
        "id": f"p{uuid.uuid4().hex[:8]}",
        "author_id": post.author_id,
        "author_name": post.author_name,
        "author_city": post.author_city,
        "author_state": post.author_state,
        "post_type": post.post_type,
        "content": post.content,
        "time_ago": "just now",
        "reactions": {"🚛": 0, "💰": 0, "⭐": 0, "🔥": 0, "✅": 0},
        "comment_count": 0,
        "location_tag": post.location_tag,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _feed_posts.append(new_post)
    logger.info(f"New community post by {post.author_name}: {post.content[:60]}")
    return FeedPostResponse(**new_post)


@app.post(
    "/api/v1/community/feed/{post_id}/react",
    tags=["community"],
    summary="React to a feed post",
)
async def react_to_post(post_id: str, reaction: FeedReaction):
    """Adds or toggles a reaction emoji on a feed post."""
    valid_reactions = {"🚛", "💰", "⭐", "🔥", "✅"}
    if reaction.reaction not in valid_reactions:
        raise HTTPException(status_code=422, detail=f"Invalid reaction. Must be one of: {valid_reactions}")
    for post in _feed_posts:
        if post["id"] == post_id:
            post["reactions"][reaction.reaction] = post["reactions"].get(reaction.reaction, 0) + 1
            return {"post_id": post_id, "reaction": reaction.reaction, "count": post["reactions"][reaction.reaction]}
    raise HTTPException(status_code=404, detail=f"Post '{post_id}' not found.")


# ═══════════════════════════════════════════════════════════════════════════════
# GLOBAL EXCEPTION HANDLER
# ═══════════════════════════════════════════════════════════════════════════════

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )


# ═══════════════════════════════════════════════════════════════════════════════
# DEVELOPMENT SERVER ENTRY POINT
# Run with: python main.py
# Production: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "production") == "development",
        log_level="info",
    )
