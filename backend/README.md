# PHI Backend — Prince Haul Intelligence API

FastAPI + CrewAI backend powering the 15 AI agents in the PHI mobile app.

## Requirements

- Python 3.11+
- Anthropic API key

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=sqlite:///./phi.db    # or postgresql://user:pass@host/dbname
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/workers/status` | All 15 agent statuses |
| POST | `/api/find-freight` | Run FindFreight crew (3 agents) |
| POST | `/api/start-trip` | Run StartTrip crew (4 agents) |
| POST | `/api/payday` | Run Payday crew — BOL → invoice → notify |
| POST | `/api/compliance` | Run Compliance crew — HOS + maintenance + IFTA |
| GET | `/api/dashboard/{driver_id}` | Run Dashboard crew — daily exec summary |
| POST | `/api/drivers` | Create driver profile |
| GET | `/api/drivers/{driver_id}` | Get driver profile |
| PATCH | `/api/drivers/{driver_id}` | Update driver profile |
| POST | `/api/loads` | Create load |
| GET | `/api/loads` | List loads |
| GET | `/api/loads/{load_id}` | Get load |
| PATCH | `/api/loads/{load_id}/book` | Book a load |
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/{invoice_id}` | Get invoice |
| GET | `/api/logs` | Agent execution logs |

## Agent Architecture

```
15 Agents across 4 modules:

dispatch_agents.py      Agents 1, 3, 6, 8
  dispatch_coordinator    — broker-to-truck bridge, load lifecycle
  route_optimizer         — HGV routing, traffic/weather/bridge restrictions
  fuel_optimizer          — EIA diesel prices, optimal fill-up strategy
  track_trace_agent       — automatic ETA updates to shippers/receivers

financial_agents.py     Agents 2, 5, 12, 13
  freight_negotiator      — 24/7 load board scanning, rate negotiation
  invoice_specialist      — BOL → invoice → factoring → cash in 24hrs
  revenue_analyst         — RPM trends, lane profitability, weekly reports
  cpm_calculator          — real-time Cost Per Mile, net margin

legal_safety_agents.py  Agents 4, 11, 14
  compliance_officer      — ELD/HOS monitoring, IFTA, DOT compliance
  fleet_maintenance_monitor — predictive maintenance, breakdown prevention
  risk_assessment_agent   — broker vetting, double-broker detection

operational_agents.py   Agents 7, 9, 10, 15
  load_scoring_agent      — 0-100 composite scoring (Diamond/Gold/Standard)
  driver_liaison          — digital co-pilot: weigh stations, rest stops, BOLs
  business_intelligence_exec — CPM + P&L synthesis, daily exec summary
  market_intelligence_agent  — lane rate trends, seasonal demand
```

## 5 Crew Workflows

| Crew | Mobile Trigger | Agents |
|------|---------------|--------|
| FindFreightCrew | "Find Freight" button | freight_negotiator → load_scoring → risk_assessment |
| StartTripCrew | "Start Trip" button | route_optimizer → fuel_optimizer → dispatch_coordinator → driver_liaison |
| PaydayCrew | "One-Tap Payday" | invoice_specialist → cpm_calculator → track_trace_agent |
| ComplianceCrew | Compliance screen | compliance_officer → fleet_maintenance → ifta report |
| DashboardCrew | Morning dashboard | revenue_analyst → cpm_calculator → market_intelligence → bi_exec |
