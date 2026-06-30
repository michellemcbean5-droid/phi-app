# Prince Haul Intelligence — Python Backend

**Fully autonomous 15-agent AI ecosystem for trucking owner-operators.**
Built with CrewAI, LangChain-OpenAI, and FastAPI. Engineered for the
Q-Empire Automation Division's $1,000,000 revenue target by end of 2026.

---

## Repository Structure

```
backend/
├── agents.py          ← 15 specialized CrewAI agents (all logic, all groups)
├── tasks.py           ← 3 multi-agent crew workflow builders
├── main.py            ← FastAPI application with all REST endpoints
├── requirements.txt   ← Python dependencies
├── .env.example       ← Environment variable template (copy to .env)
└── app/
    └── database.py    ← SQLAlchemy ORM models (optional persistence layer)
```

---

## Prerequisites

- Python **3.11** or higher
- An **OpenAI API key** with GPT-4o access
- Git

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/michellemcbean5-droid/phi-app.git
cd phi-app/backend
```

---

## Step 2 — Create a Virtual Environment

```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate

# Windows (PowerShell)
python -m venv .venv
.venv\Scripts\Activate.ps1
```

You should see `(.venv)` in your terminal prompt.

---

## Step 3 — Install Dependencies

```bash
pip install -r requirements.txt
```

This installs CrewAI, LangChain-OpenAI, FastAPI, Pydantic, Uvicorn, and all supporting packages.

---

## Step 4 — Configure Environment Variables

Copy the example file and fill in your OpenAI key:

```bash
cp .env.example .env
```

Open `.env` and set your values:

```env
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
OPENAI_MODEL=gpt-4o
PORT=8000
ENV=development
```

> **Security note:** Never commit your `.env` file. It is already in `.gitignore`.

---

## Step 5 — Run the Server

```bash
# Development (auto-reload on file changes)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use the built-in entry point
python main.py
```

The API is now live. Open your browser:

| URL | Description |
|-----|-------------|
| `http://localhost:8000/docs` | Swagger UI — interactive API explorer |
| `http://localhost:8000/redoc` | ReDoc — clean reference documentation |
| `http://localhost:8000/health` | Health check endpoint |
| `http://localhost:8000/api/v1/agents` | See all 15 agents |

---

## API Reference

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Service identity and version |
| `GET` | `/health` | Uptime health check |
| `GET` | `/api/v1/agents` | All 15 agents with role summaries |
| `GET` | `/api/v1/agents/groups` | Agents organized by functional group |

### Core Workflows

| Method | Endpoint | Workflow | Mobile Trigger |
|--------|----------|----------|----------------|
| `POST` | `/api/v1/autonomous-booking` | Load Acquisition | "Find Freight" button |
| `POST` | `/api/v1/active-transit` | Dispatch & Transit | "Start Trip" button |
| `POST` | `/api/v1/post-delivery` | Post-Delivery Close | "One-Tap Payday" |

All workflow endpoints return immediately with a `job_id`. Poll for results:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/jobs/{job_id}` | Get job status and result |
| `GET` | `/api/v1/jobs` | List all jobs (filterable by status/workflow) |

### Synchronous Testing Endpoints
*(Blocks until complete — use only for local testing, not in production)*

| Method | Endpoint |
|--------|----------|
| `POST` | `/api/v1/autonomous-booking/sync` |
| `POST` | `/api/v1/active-transit/sync` |
| `POST` | `/api/v1/post-delivery/sync` |

---

## Agent Architecture

### Group 1 — Operational & Dispatch

| # | Agent | Function |
|---|-------|----------|
| 1 | **Dispatcher** | Load assignment, broker communication, check-call scheduling |
| 2 | **Route Optimizer** | Truck-legal routing, HOS insertions, restriction filtering |
| 3 | **Fuel Optimizer** | Diesel price optimization, fuel stop engineering |
| 4 | **Track & Trace Liaison** | Automated ETA updates, check-call automation |

### Group 2 — Financial & Marketing

| # | Agent | Function |
|---|-------|----------|
| 5 | **Freight Negotiator** | 24/7 load board scanning, rate negotiation, load booking |
| 6 | **Invoice & Factoring Clerk** | BOL → invoice → factoring submission → cash in 24hrs |
| 7 | **Tax & Expense Auditor** | Deduction capture, IFTA tracking, quarterly tax estimates |
| 8 | **Direct Shipper Marketer** | B2B outreach, direct contract development, broker bypass |

### Group 3 — Legal, Risk & Safety

| # | Agent | Function |
|---|-------|----------|
| 9 | **DOT Compliance Auditor** | HOS monitoring, driver qualification files, FMCSA compliance |
| 10 | **Contract Legal Auditor** | Rate confirmation review, predatory clause detection |
| 11 | **Risk & Liability Assessor** | 5-dimension load risk scoring, Go/No-Go recommendations |

### Group 4 — Hardware & Support

| # | Agent | Function |
|---|-------|----------|
| 12 | **Fleet Maintenance Monitor** | Predictive maintenance, DTC monitoring, service scheduling |
| 13 | **In-Cab Virtual Assistant** | Driver co-pilot, paperwork management, real-time alerts |
| 14 | **Crisis Response Controller** | 24/7 incident response, roadside coordination, rerouting |

### Group 5 — Executive Intelligence

| # | Agent | Function |
|---|-------|----------|
| 15 | **Business Intelligence Executive** | P&L synthesis, CPM/RPM tracking, $1M target pacing |

---

## Workflow Details

### Workflow 1: Autonomous Load Acquisition
```
POST /api/v1/autonomous-booking

FreightNegotiator  →  scans top 15 loads from load boards
InsuranceAssessor  →  5-dimension risk scoring (broker, cargo, route, equipment, timeline)
LegalAuditor       →  contract clause audit, counter-clause recommendations
FreightNegotiator  →  rate negotiation at 75th percentile floor, books best RPM
ComplianceOfficer  →  HOS feasibility + driver qualification clearance
```

### Workflow 2: Active Dispatch & Transit
```
POST /api/v1/active-transit

RouteOptimizer     →  truck-legal route with HOS break insertions
FuelOptimizer      →  diesel price optimization, IFTA mileage tracking
Dispatcher         →  broker notification, shipper confirmation, check-call schedule
TrackTraceLiaison  →  arms automated monitoring from pickup to delivery
DriverLiaison      →  in-cab briefing: route, fuel, HOS, weigh stations, contacts
```

### Workflow 3: Post-Delivery Financial Close
```
POST /api/v1/post-delivery

FinanceSpecialist  →  invoice generation + factoring submission (target: 24hr advance)
TaxAuditor         →  expense deduction logging + IFTA state mileage update
MaintenanceMonitor →  service interval recalculation + URGENT flag detection
BIExecutive        →  daily P&L brief + YTD vs $1M target pacing report
```

---

## Example API Calls

### Find Freight
```bash
curl -X POST http://localhost:8000/api/v1/autonomous-booking \
  -H "Content-Type: application/json" \
  -d '{
    "driver_id": "driver-001",
    "equipment_type": "Dry Van",
    "min_rpm": 3.00,
    "preferred_states": ["TX", "FL", "GA", "TN"],
    "avoid_states": ["CA", "NY"],
    "home_city": "Dallas",
    "home_state": "TX",
    "available_date": "2026-07-01",
    "max_deadhead_miles": 150
  }'
```

### Start Trip
```bash
curl -X POST http://localhost:8000/api/v1/active-transit \
  -H "Content-Type: application/json" \
  -d '{
    "load": {
      "id": "RC-2026-001",
      "origin_city": "Dallas", "origin_state": "TX",
      "destination_city": "Atlanta", "destination_state": "GA",
      "rate": 2850.00, "miles": 780,
      "pickup_date": "2026-07-01", "delivery_date": "2026-07-02",
      "broker_name": "Acme Freight LLC",
      "broker_contact": "555-123-4567"
    },
    "driver": {
      "driver_id": "driver-001",
      "current_city": "Dallas", "current_state": "TX",
      "current_lat": 32.7767, "current_lng": -96.7970,
      "hos_remaining_drive": 11.0,
      "hos_remaining_duty": 14.0,
      "odometer": 385000
    }
  }'
```

### One-Tap Payday
```bash
curl -X POST http://localhost:8000/api/v1/post-delivery \
  -H "Content-Type: application/json" \
  -d '{
    "load_id": "RC-2026-001",
    "driver_id": "driver-001",
    "bol_text": "BOL #12345 | Shipper: ABC Manufacturing | Consignee: XYZ Distribution | Commodity: General Freight | Weight: 42000 lbs | Delivered and signed 07/02/2026",
    "agreed_rate": 2850.00,
    "miles": 780,
    "fuel_cost": 312.00,
    "toll_cost": 28.50,
    "origin": "Dallas, TX",
    "destination": "Atlanta, GA",
    "delivery_date": "2026-07-02",
    "broker_name": "Acme Freight LLC",
    "factoring_company": "OTR Capital",
    "days_on_road": 1,
    "states_driven": ["TX", "LA", "MS", "AL", "GA"]
  }'
```

### Poll Job Status
```bash
curl http://localhost:8000/api/v1/jobs/{job_id}
```

---

## Production Deployment

For production, replace the in-memory job store with Redis + Celery:

```bash
pip install celery redis
```

Then configure `REDIS_URL` in your `.env` and update the background task runner
in `main.py` to use `celery.delay()` instead of `BackgroundTasks`.

Run with multiple Uvicorn workers:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Revenue Target Tracking

The Business Intelligence Executive (Agent 15) tracks every load against the
**$1,000,000 annual revenue target** and reports:
- YTD gross revenue and net profit
- Weekly run-rate required to hit target
- Pace status: `ON_TRACK` / `BEHIND` / `AHEAD`
- #1 action item to accelerate revenue on the next load

---

*Prince Haul Intelligence — Q-Empire Automation Division*
