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

from fastapi import (
    BackgroundTasks,
    FastAPI,
    Header,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
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
from app.database import (
    CustomerAppointment,
    CustomerFollowUp,
    CustomerJourneyEvent,
    CustomerLead,
    CustomerRevenueEntry,
    SessionLocal,
    User,
    get_customer_lead,
    get_fcm_token,
    log_customer_event,
    set_fcm_token,
)

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


# ── Customer acquisition and lifecycle models ─────────────────────────────────

class CustomerJourney(str, Enum):
    LAUNCH = "launch"
    DISPATCH = "dispatch"
    FLEET = "fleet"


class CustomerLeadStage(str, Enum):
    NEW = "new"
    QUALIFIED = "qualified"
    OPPORTUNITY = "opportunity"
    WON = "won"
    LOST = "lost"
    NURTURE = "nurture"


class OnboardingStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"
    BLOCKED = "blocked"


class LeadCaptureRequest(BaseModel):
    """Consent-based public intake request from the PHI assessment journey."""
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    phone: Optional[str] = Field(default=None, max_length=40)
    company_name: Optional[str] = Field(default=None, max_length=160)
    journey: CustomerJourney
    equipment_type: Optional[EquipmentType] = None
    truck_count: int = Field(default=0, ge=0, le=10_000)
    home_state: Optional[str] = Field(default=None, min_length=2, max_length=2)
    top_challenge: str = Field(min_length=2, max_length=500)
    preferred_contact: str = Field(default="email", pattern="^(email|phone|text)$")
    consent_marketing: bool = Field(
        description="Explicit consent to receive follow-up for the requested PHI assessment."
    )
    lead_source: str = Field(default="website", min_length=2, max_length=80)
    source_detail: Optional[str] = Field(default=None, max_length=180)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Enter a valid email address.")
        return normalized

    @field_validator("home_state")
    @classmethod
    def normalize_state(cls, value: Optional[str]) -> Optional[str]:
        return value.upper() if value else None


class LeadStageUpdateRequest(BaseModel):
    """Admin-only stage change with a mandatory audit reason."""
    stage: CustomerLeadStage
    reason: str = Field(min_length=3, max_length=500)
    owner: Optional[str] = Field(default=None, max_length=120)
    next_action_at: Optional[datetime] = None


class OnboardingUpdateRequest(BaseModel):
    """Admin-only onboarding status change after a customer has agreed to proceed."""
    status: OnboardingStatus
    reason: str = Field(min_length=3, max_length=500)
    activated_user_id: Optional[str] = None


class CustomerLeadResponse(BaseModel):
    id: str
    full_name: str
    email: str
    company_name: Optional[str]
    journey: CustomerJourney
    stage: CustomerLeadStage
    equipment_type: Optional[str]
    truck_count: int
    top_challenge: str
    qualification_score: int
    recommended_offer: str
    owner: str
    onboarding_status: OnboardingStatus
    created_at: datetime
    updated_at: datetime


class CustomerJourneyEventResponse(BaseModel):
    id: int
    event_type: str
    actor: str
    event_metadata: dict
    created_at: datetime


class FollowUpStatus(str, Enum):
    READY = "ready"
    HELD = "held"
    SENT = "sent"
    CANCELLED = "cancelled"
    FAILED = "failed"
    SUPPRESSED = "suppressed"


class AppointmentStatus(str, Enum):
    REQUESTED = "requested"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class FollowUpStatusUpdateRequest(BaseModel):
    status: FollowUpStatus
    reason: str = Field(min_length=3, max_length=500)
    external_message_id: Optional[str] = Field(default=None, max_length=200)


class AppointmentCreateRequest(BaseModel):
    booking_url: Optional[str] = Field(default=None, max_length=500)
    host_name: Optional[str] = Field(default=None, max_length=120)
    notes: Optional[str] = Field(default=None, max_length=2_000)


class AppointmentStatusUpdateRequest(BaseModel):
    status: AppointmentStatus
    reason: str = Field(min_length=3, max_length=500)
    scheduled_for: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    provider_booking_id: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=2_000)


class RevenueEntryCreateRequest(BaseModel):
    amount_mrr: float = Field(gt=0, le=1_000_000)
    source: str = Field(default="manual_verified", min_length=2, max_length=120)
    reason: str = Field(min_length=3, max_length=500)


class CustomerFollowUpResponse(BaseModel):
    id: str
    lead_id: str
    lead_name: str
    lead_email: str
    sequence_step: str
    channel: str
    status: FollowUpStatus
    subject: Optional[str]
    body: str
    scheduled_at: Optional[datetime]
    sent_at: Optional[datetime]
    suppression_reason: Optional[str]
    created_at: datetime


class CustomerAppointmentResponse(BaseModel):
    id: str
    lead_id: str
    lead_name: str
    status: AppointmentStatus
    booking_url: Optional[str]
    host_name: Optional[str]
    scheduled_for: Optional[datetime]
    completed_at: Optional[datetime]
    notes: Optional[str]
    created_at: datetime


class CustomerOperationsDashboardResponse(BaseModel):
    revenue_target_mrr: float
    verified_mrr: float
    remaining_mrr: float
    stage_counts: dict[str, int]
    qualified_leads: int
    active_followups: int
    held_followups: int
    appointment_counts: dict[str, int]
    source_counts: dict[str, int]
    conversion_notes: list[str]


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

def _require_admin_token(
    x_phi_admin_token: Optional[str] = Header(default=None),
) -> None:
    """Protect staff-only customer lifecycle records from public access."""
    configured_token = os.getenv("PHI_ADMIN_TOKEN")
    if not configured_token:
        raise HTTPException(
            status_code=503,
            detail="Customer operations require PHI_ADMIN_TOKEN to be configured.",
        )
    if x_phi_admin_token != configured_token:
        raise HTTPException(status_code=401, detail="Invalid customer operations token.")


def _lead_score_and_offer(request: LeadCaptureRequest) -> tuple[int, str, CustomerLeadStage]:
    """Apply transparent, deterministic qualification rules to an opted-in prospect."""
    score = 20 if request.consent_marketing else 0
    score += 25 if request.journey == CustomerJourney.DISPATCH else 15
    score += 20 if request.journey == CustomerJourney.FLEET or request.truck_count >= 2 else 5
    score += 10 if request.phone else 0
    score += 10 if request.top_challenge.strip() else 0
    score += 10 if request.equipment_type else 0
    score = min(score, 100)

    if request.journey == CustomerJourney.LAUNCH:
        offer = "Business Readiness & Equipment Path"
    elif request.journey == CustomerJourney.FLEET or request.truck_count >= 2:
        offer = "Fleet Operations Snapshot"
    else:
        offer = "Dispatch & Profit Diagnostic"

    stage = CustomerLeadStage.QUALIFIED if score >= 55 else CustomerLeadStage.NEW
    return score, offer, stage


def _lead_response(lead: CustomerLead) -> CustomerLeadResponse:
    """Map a persisted SQLAlchemy lead into the public lifecycle response contract."""
    return CustomerLeadResponse(
        id=lead.id,
        full_name=lead.full_name,
        email=lead.email,
        company_name=lead.company_name,
        journey=CustomerJourney(lead.journey),
        stage=CustomerLeadStage(lead.stage),
        equipment_type=lead.equipment_type,
        truck_count=lead.truck_count,
        top_challenge=lead.top_challenge,
        qualification_score=lead.qualification_score,
        recommended_offer=lead.recommended_offer or "PHI Assessment",
        owner=lead.owner,
        onboarding_status=OnboardingStatus(lead.onboarding_status),
        created_at=lead.created_at,
        updated_at=lead.updated_at,
    )


def _followup_response(followup: CustomerFollowUp, lead: CustomerLead) -> CustomerFollowUpResponse:
    """Map a follow-up queue record with only the related lead data needed by staff."""
    return CustomerFollowUpResponse(
        id=followup.id,
        lead_id=lead.id,
        lead_name=lead.full_name,
        lead_email=lead.email,
        sequence_step=followup.sequence_step,
        channel=followup.channel,
        status=FollowUpStatus(followup.status),
        subject=followup.subject,
        body=followup.body,
        scheduled_at=followup.scheduled_at,
        sent_at=followup.sent_at,
        suppression_reason=followup.suppression_reason,
        created_at=followup.created_at,
    )


def _appointment_response(appointment: CustomerAppointment, lead: CustomerLead) -> CustomerAppointmentResponse:
    """Map a consultation record without exposing database-only details."""
    return CustomerAppointmentResponse(
        id=appointment.id,
        lead_id=lead.id,
        lead_name=lead.full_name,
        status=AppointmentStatus(appointment.status),
        booking_url=appointment.booking_url,
        host_name=appointment.host_name,
        scheduled_for=appointment.scheduled_for,
        completed_at=appointment.completed_at,
        notes=appointment.notes,
        created_at=appointment.created_at,
    )


def _commercial_email_footer() -> str:
    """Return PHI's approved commercial-email identity without pretending a message was delivered."""
    mailing_address = os.getenv("PHI_BUSINESS_MAILING_ADDRESS", "").strip()
    address_line = mailing_address or "PHI business mailing address must be configured before delivery."
    return (
        "\n\n—\n"
        "Prince Haul Intelligence\n"
        f"{address_line}\n\n"
        "You received this follow-up after requesting a PHI assessment. "
        "To stop future PHI follow-up emails, reply UNSUBSCRIBE."
    )


def _assessment_followup_copy(lead: CustomerLead) -> tuple[str, str]:
    """Create factual assessment-response copy; sending remains a separately controlled action."""
    subject = f"Your PHI {lead.recommended_offer or 'Game Plan'}"
    if lead.journey == CustomerJourney.LAUNCH.value:
        next_step = "your business-readiness, equipment, and first-load operating priorities"
    elif lead.journey == CustomerJourney.FLEET.value:
        next_step = "where information is breaking between trucks, dispatch, documents, and customers"
    else:
        next_step = "your load, dispatch, document, and profit workflow"
    body = (
        f"Hi {lead.full_name},\n\n"
        f"Thank you for requesting a PHI assessment. Based on what you shared, "
        f"your recommended starting point is: {lead.recommended_offer or 'PHI Game Plan'}. "
        f"The first conversation will focus on {next_step}.\n\n"
        "PHI can organize the work and explain the next step, but you remain in control of business, safety, regulatory, and commercial decisions.\n\n"
        "Reply with the best time for a short planning conversation, or use the PHI booking link when it is available."
        f"{_commercial_email_footer()}"
    )
    return subject, body


def _queue_assessment_followup(db, lead: CustomerLead) -> CustomerFollowUp | None:
    """Create one assessment follow-up draft per consented lead; never send from this function."""
    if not lead.consent_marketing:
        return None
    existing = (
        db.query(CustomerFollowUp)
        .filter(
            CustomerFollowUp.lead_id == lead.id,
            CustomerFollowUp.sequence_step == "assessment_response",
        )
        .first()
    )
    if existing:
        return existing
    subject, body = _assessment_followup_copy(lead)
    followup = CustomerFollowUp(
        lead_id=lead.id,
        sequence_step="assessment_response",
        channel="email",
        status=FollowUpStatus.READY.value,
        subject=subject,
        body=body,
        scheduled_at=datetime.now(timezone.utc),
    )
    db.add(followup)
    db.commit()
    db.refresh(followup)
    log_customer_event(
        db,
        lead_id=lead.id,
        event_type="followup.prepared",
        actor="acquisition-orchestrator",
        metadata={"followup_id": followup.id, "sequence_step": followup.sequence_step},
    )
    return followup


def _create_job(workflow: str):
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
# CUSTOMER ACQUISITION AND LIFECYCLE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post(
    "/api/v1/customer-journey/leads",
    response_model=CustomerLeadResponse,
    tags=["customer-journey"],
    status_code=201,
    summary="Capture a consented PHI assessment lead",
)
def capture_customer_lead(request: LeadCaptureRequest):
    """
    Creates or refreshes a consented website-assessment lead. This public endpoint
    records source, product path, operating context, and consent. It does not send
    messages, create payment obligations, or mark a deal as won.
    """
    if not request.consent_marketing:
        raise HTTPException(
            status_code=422,
            detail="Explicit follow-up consent is required to submit a PHI assessment.",
        )

    db = SessionLocal()
    try:
        score, offer, suggested_stage = _lead_score_and_offer(request)
        existing = db.query(CustomerLead).filter(CustomerLead.email == request.email).first()
        now = datetime.now(timezone.utc)

        if existing:
            existing.full_name = request.full_name
            existing.phone = request.phone or existing.phone
            existing.company_name = request.company_name or existing.company_name
            existing.journey = request.journey.value
            existing.lead_source = request.lead_source
            existing.source_detail = request.source_detail
            existing.equipment_type = (
                request.equipment_type.value if request.equipment_type else existing.equipment_type
            )
            existing.truck_count = request.truck_count
            existing.home_state = request.home_state
            existing.top_challenge = request.top_challenge
            existing.preferred_contact = request.preferred_contact
            existing.consent_marketing = True
            existing.consent_captured_at = now
            existing.qualification_score = max(existing.qualification_score, score)
            existing.recommended_offer = offer
            if existing.stage in {CustomerLeadStage.NEW.value, CustomerLeadStage.NURTURE.value}:
                existing.stage = suggested_stage.value
            db.commit()
            db.refresh(existing)
            log_customer_event(
                db,
                lead_id=existing.id,
                event_type="lead.reengaged",
                actor="website",
                metadata={"source": request.lead_source, "journey": request.journey.value},
            )
            _queue_assessment_followup(db, existing)
            return _lead_response(existing)

        lead = CustomerLead(
            full_name=request.full_name,
            email=request.email,
            phone=request.phone,
            company_name=request.company_name,
            journey=request.journey.value,
            stage=suggested_stage.value,
            lead_source=request.lead_source,
            source_detail=request.source_detail,
            equipment_type=request.equipment_type.value if request.equipment_type else None,
            truck_count=request.truck_count,
            home_state=request.home_state,
            top_challenge=request.top_challenge,
            preferred_contact=request.preferred_contact,
            consent_marketing=True,
            consent_captured_at=now,
            qualification_score=score,
            recommended_offer=offer,
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)
        log_customer_event(
            db,
            lead_id=lead.id,
            event_type="lead.created",
            actor="website",
            metadata={
                "source": request.lead_source,
                "journey": request.journey.value,
                "qualification_score": score,
                "recommended_offer": offer,
            },
        )
        if lead.stage == CustomerLeadStage.QUALIFIED.value:
            log_customer_event(
                db,
                lead_id=lead.id,
                event_type="lead.qualified",
                actor="qualification-engine",
                metadata={"qualification_score": score, "recommended_offer": offer},
            )
        _queue_assessment_followup(db, lead)
        return _lead_response(lead)
    finally:
        db.close()


@app.get(
    "/api/v1/customer-journey/leads",
    response_model=list[CustomerLeadResponse],
    tags=["customer-journey"],
    summary="List customer leads for the PHI operations team",
)
def list_customer_leads(
    stage: Optional[CustomerLeadStage] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """Returns lead records for authorized PHI customer-operations users only."""
    _require_admin_token(x_phi_admin_token)
    db = SessionLocal()
    try:
        query = db.query(CustomerLead)
        if stage:
            query = query.filter(CustomerLead.stage == stage.value)
        leads = query.order_by(CustomerLead.updated_at.desc()).offset(offset).limit(limit).all()
        return [_lead_response(lead) for lead in leads]
    finally:
        db.close()


@app.get(
    "/api/v1/customer-journey/leads/{lead_id}/events",
    response_model=list[CustomerJourneyEventResponse],
    tags=["customer-journey"],
    summary="List the audit trail for a customer lifecycle record",
)
def list_customer_lead_events(
    lead_id: str,
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """Returns the append-only lifecycle event ledger for an authorized operator."""
    _require_admin_token(x_phi_admin_token)
    db = SessionLocal()
    try:
        if not get_customer_lead(db, lead_id):
            raise HTTPException(status_code=404, detail="Customer lead not found.")
        events = (
            db.query(CustomerJourneyEvent)
            .filter(CustomerJourneyEvent.lead_id == lead_id)
            .order_by(CustomerJourneyEvent.created_at.desc())
            .all()
        )
        return [
            CustomerJourneyEventResponse(
                id=event.id,
                event_type=event.event_type,
                actor=event.actor,
                event_metadata=event.event_metadata or {},
                created_at=event.created_at,
            )
            for event in events
        ]
    finally:
        db.close()


@app.patch(
    "/api/v1/customer-journey/leads/{lead_id}/stage",
    response_model=CustomerLeadResponse,
    tags=["customer-journey"],
    summary="Update a lead stage with an auditable reason",
)
def update_customer_lead_stage(
    lead_id: str,
    request: LeadStageUpdateRequest,
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """Updates a commercial stage; this route never charges, contracts, or messages a lead."""
    _require_admin_token(x_phi_admin_token)
    db = SessionLocal()
    try:
        lead = get_customer_lead(db, lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Customer lead not found.")
        previous_stage = lead.stage
        lead.stage = request.stage.value
        if request.owner:
            lead.owner = request.owner
        if request.next_action_at:
            lead.next_action_at = request.next_action_at
        db.commit()
        db.refresh(lead)
        log_customer_event(
            db,
            lead_id=lead.id,
            event_type="lead.stage_changed",
            actor="customer-operations",
            metadata={
                "from": previous_stage,
                "to": request.stage.value,
                "reason": request.reason,
                "owner": lead.owner,
            },
        )
        return _lead_response(lead)
    finally:
        db.close()


@app.patch(
    "/api/v1/customer-journey/leads/{lead_id}/onboarding",
    response_model=CustomerLeadResponse,
    tags=["customer-journey"],
    summary="Start or update customer onboarding after a verified commercial decision",
)
def update_customer_onboarding(
    lead_id: str,
    request: OnboardingUpdateRequest,
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """
    Updates onboarding for an authorized operations user. A lead must be marked won
    before onboarding can start, keeping commercial acceptance separate from automation.
    """
    _require_admin_token(x_phi_admin_token)
    db = SessionLocal()
    try:
        lead = get_customer_lead(db, lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Customer lead not found.")
        if request.status in {OnboardingStatus.IN_PROGRESS, OnboardingStatus.COMPLETE}:
            if lead.stage != CustomerLeadStage.WON.value:
                raise HTTPException(
                    status_code=409,
                    detail="Mark the opportunity won through an authorized commercial process before onboarding.",
                )
        if request.activated_user_id:
            customer = db.query(User).filter(User.id == request.activated_user_id).first()
            if not customer:
                raise HTTPException(status_code=422, detail="Activated user record was not found.")
            lead.activated_user_id = request.activated_user_id
        lead.onboarding_status = request.status.value
        db.commit()
        db.refresh(lead)
        log_customer_event(
            db,
            lead_id=lead.id,
            event_type=f"onboarding.{request.status.value}",
            actor="onboarding-operations",
            metadata={"reason": request.reason, "activated_user_id": lead.activated_user_id},
        )
        return _lead_response(lead)
    finally:
        db.close()


# ── PHI-native free sales workspace ───────────────────────────────────────────

@app.get(
    "/api/v1/customer-journey/operations/dashboard",
    response_model=CustomerOperationsDashboardResponse,
    tags=["customer-journey"],
    summary="Return the free PHI customer-acquisition command center metrics",
)
def get_customer_operations_dashboard(
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """Returns verified pipeline and revenue information for an authorized PHI operator."""
    _require_admin_token(x_phi_admin_token)
    db = SessionLocal()
    try:
        stages = [stage.value for stage in CustomerLeadStage]
        appointment_statuses = [status.value for status in AppointmentStatus]
        stage_counts = {
            stage: db.query(CustomerLead).filter(CustomerLead.stage == stage).count()
            for stage in stages
        }
        appointment_counts = {
            status: db.query(CustomerAppointment).filter(CustomerAppointment.status == status).count()
            for status in appointment_statuses
        }
        source_counts: dict[str, int] = {}
        for lead_source, count in (
            db.query(CustomerLead.lead_source, CustomerLead.id)
            .order_by(CustomerLead.created_at.desc())
            .all()
        ):
            source_counts[lead_source] = source_counts.get(lead_source, 0) + 1
        verified_mrr = sum(
            entry.amount_mrr
            for entry in db.query(CustomerRevenueEntry)
            .filter(CustomerRevenueEntry.status == "active")
            .all()
        )
        target = 35_000.0
        return CustomerOperationsDashboardResponse(
            revenue_target_mrr=target,
            verified_mrr=round(verified_mrr, 2),
            remaining_mrr=round(max(target - verified_mrr, 0), 2),
            stage_counts=stage_counts,
            qualified_leads=stage_counts[CustomerLeadStage.QUALIFIED.value],
            active_followups=db.query(CustomerFollowUp)
            .filter(CustomerFollowUp.status == FollowUpStatus.READY.value)
            .count(),
            held_followups=db.query(CustomerFollowUp)
            .filter(CustomerFollowUp.status == FollowUpStatus.HELD.value)
            .count(),
            appointment_counts=appointment_counts,
            source_counts=source_counts,
            conversion_notes=[
                "Verified MRR includes active revenue entries only; it excludes forecasts and pipeline value.",
                "A prepared follow-up is not represented as sent until a verified sender returns a delivery identifier.",
                "Appointment and commercial outcomes require the configured PHI operating policy.",
            ],
        )
    finally:
        db.close()


@app.get(
    "/api/v1/customer-journey/followups",
    response_model=list[CustomerFollowUpResponse],
    tags=["customer-journey"],
    summary="List the PHI free follow-up queue",
)
def list_customer_followups(
    status: Optional[FollowUpStatus] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """Returns prepared and delivery-tracked messages for authorized customer operations."""
    _require_admin_token(x_phi_admin_token)
    db = SessionLocal()
    try:
        query = db.query(CustomerFollowUp)
        if status:
            query = query.filter(CustomerFollowUp.status == status.value)
        followups = query.order_by(CustomerFollowUp.created_at.desc()).limit(limit).all()
        response: list[CustomerFollowUpResponse] = []
        for followup in followups:
            lead = get_customer_lead(db, followup.lead_id)
            if lead:
                response.append(_followup_response(followup, lead))
        return response
    finally:
        db.close()


@app.patch(
    "/api/v1/customer-journey/followups/{followup_id}",
    response_model=CustomerFollowUpResponse,
    tags=["customer-journey"],
    summary="Record a controlled follow-up delivery, hold, cancellation, or suppression",
)
def update_customer_followup(
    followup_id: str,
    request: FollowUpStatusUpdateRequest,
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """Records delivery state without ever sending a message from an unconfigured channel."""
    _require_admin_token(x_phi_admin_token)
    if request.status == FollowUpStatus.SENT and not request.external_message_id:
        raise HTTPException(
            status_code=422,
            detail="A sender delivery ID is required before marking a follow-up as sent.",
        )
    db = SessionLocal()
    try:
        followup = db.query(CustomerFollowUp).filter(CustomerFollowUp.id == followup_id).first()
        if not followup:
            raise HTTPException(status_code=404, detail="Customer follow-up not found.")
        lead = get_customer_lead(db, followup.lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Related customer lead not found.")
        followup.status = request.status.value
        if request.status == FollowUpStatus.SENT:
            followup.sent_at = datetime.now(timezone.utc)
            followup.external_message_id = request.external_message_id
        if request.status == FollowUpStatus.SUPPRESSED:
            followup.suppression_reason = request.reason
            lead.consent_marketing = False
        db.commit()
        db.refresh(followup)
        log_customer_event(
            db,
            lead_id=lead.id,
            event_type=f"followup.{request.status.value}",
            actor="customer-operations",
            metadata={"followup_id": followup.id, "reason": request.reason},
        )
        return _followup_response(followup, lead)
    finally:
        db.close()


@app.get(
    "/api/v1/customer-journey/appointments",
    response_model=list[CustomerAppointmentResponse],
    tags=["customer-journey"],
    summary="List PHI consultation handoffs",
)
def list_customer_appointments(
    status: Optional[AppointmentStatus] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """Returns consultation records without requiring a paid booking provider."""
    _require_admin_token(x_phi_admin_token)
    db = SessionLocal()
    try:
        query = db.query(CustomerAppointment)
        if status:
            query = query.filter(CustomerAppointment.status == status.value)
        appointments = query.order_by(CustomerAppointment.created_at.desc()).limit(limit).all()
        response: list[CustomerAppointmentResponse] = []
        for appointment in appointments:
            lead = get_customer_lead(db, appointment.lead_id)
            if lead:
                response.append(_appointment_response(appointment, lead))
        return response
    finally:
        db.close()


@app.post(
    "/api/v1/customer-journey/leads/{lead_id}/appointments",
    response_model=CustomerAppointmentResponse,
    tags=["customer-journey"],
    status_code=201,
    summary="Create a free consultation handoff for a consented PHI lead",
)
def create_customer_appointment(
    lead_id: str,
    request: AppointmentCreateRequest,
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """Creates a consultation request; it does not publish calendar availability or send a confirmation."""
    _require_admin_token(x_phi_admin_token)
    db = SessionLocal()
    try:
        lead = get_customer_lead(db, lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Customer lead not found.")
        appointment = CustomerAppointment(
            lead_id=lead.id,
            status=AppointmentStatus.REQUESTED.value,
            booking_url=request.booking_url,
            host_name=request.host_name,
            notes=request.notes,
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        log_customer_event(
            db,
            lead_id=lead.id,
            event_type="appointment.requested",
            actor="acquisition-orchestrator",
            metadata={"appointment_id": appointment.id, "host_name": appointment.host_name},
        )
        return _appointment_response(appointment, lead)
    finally:
        db.close()


@app.patch(
    "/api/v1/customer-journey/appointments/{appointment_id}",
    response_model=CustomerAppointmentResponse,
    tags=["customer-journey"],
    summary="Update an auditable consultation outcome",
)
def update_customer_appointment(
    appointment_id: str,
    request: AppointmentStatusUpdateRequest,
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """Updates an appointment state after an authorized calendar or PHI operations action."""
    _require_admin_token(x_phi_admin_token)
    db = SessionLocal()
    try:
        appointment = db.query(CustomerAppointment).filter(CustomerAppointment.id == appointment_id).first()
        if not appointment:
            raise HTTPException(status_code=404, detail="Customer appointment not found.")
        lead = get_customer_lead(db, appointment.lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Related customer lead not found.")
        appointment.status = request.status.value
        appointment.scheduled_for = request.scheduled_for or appointment.scheduled_for
        appointment.completed_at = request.completed_at or appointment.completed_at
        appointment.provider_booking_id = request.provider_booking_id or appointment.provider_booking_id
        appointment.notes = request.notes or appointment.notes
        db.commit()
        db.refresh(appointment)
        log_customer_event(
            db,
            lead_id=lead.id,
            event_type=f"appointment.{request.status.value}",
            actor="customer-operations",
            metadata={"appointment_id": appointment.id, "reason": request.reason},
        )
        return _appointment_response(appointment, lead)
    finally:
        db.close()


@app.post(
    "/api/v1/customer-journey/leads/{lead_id}/revenue",
    tags=["customer-journey"],
    summary="Record verified recurring revenue for a won PHI customer",
)
def record_verified_customer_revenue(
    lead_id: str,
    request: RevenueEntryCreateRequest,
    x_phi_admin_token: Optional[str] = Header(default=None),
):
    """Records only verified revenue after an authorized commercial win; pipeline estimates are rejected."""
    _require_admin_token(x_phi_admin_token)
    db = SessionLocal()
    try:
        lead = get_customer_lead(db, lead_id)
        if not lead:
            raise HTTPException(status_code=404, detail="Customer lead not found.")
        if lead.stage != CustomerLeadStage.WON.value:
            raise HTTPException(
                status_code=409,
                detail="Verified revenue can only be recorded for a lead that is already marked won.",
            )
        entry = CustomerRevenueEntry(
            lead_id=lead.id,
            amount_mrr=request.amount_mrr,
            source=request.source,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        log_customer_event(
            db,
            lead_id=lead.id,
            event_type="revenue.verified",
            actor="customer-operations",
            metadata={"revenue_entry_id": entry.id, "amount_mrr": entry.amount_mrr, "reason": request.reason},
        )
        return {"id": entry.id, "lead_id": lead.id, "amount_mrr": entry.amount_mrr, "status": entry.status}
    finally:
        db.close()


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
