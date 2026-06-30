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

Production note: Replace the in-memory _job_store dict with Redis + Celery or
ARQ for persistent, scalable async job management.
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Any
from enum import Enum

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
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
