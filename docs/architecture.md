# Architecture

This document describes the high-level architecture of **Prince Haul Intelligence (PHI)**.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                │
│  ┌────────────────────┐    ┌────────────────────┐                     │
│  │   Next.js Web App  │    │  Expo Mobile App   │                     │
│  │   (React + TS)     │    │  (React Native)    │                     │
│  │   localhost:3000   │    │   Expo Go / APK    │                     │
│  └────────┬───────────┘    └────────┬───────────┘                     │
│           │ HTTP / REST             │ HTTP / REST + WS                │
│           │                         │                                 │
└───────────┼─────────────────────────┼─────────────────────────────────┘
            │                         │
            └─────────────┬───────────┘
                          │
┌─────────────────────────┼─────────────────────────────────────────────┐
│                      API LAYER                                      │
│  ┌──────────────────────┴──────────────────────┐                    │
│  │         FastAPI (Python 3.11)               │                    │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐   │                    │
│  │  │  REST   │  │ WebSocket│  │  Health  │   │                    │
│  │  │  API    │  │  /ws     │  │  /health │   │                    │
│  └──┴─────────┴──┴──────────┴──┴──────────┴───┘                    │
│  ┌──────────────────────────────────────────────┐                    │
│  │         CrewAI + LangChain-OpenAI            │                    │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐   │                    │
│  │  │ Agents  │  │  Tasks   │  │  Tools   │   │                    │
│  │  └─────────┘  └──────────┘  └──────────┘   │                    │
│  └──────────────────────────────────────────────┘                    │
│  localhost:8000                                                    │
└─────────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────────────────────────┐
│                   DATA & MESSAGING LAYER                            │
│  ┌──────────────────────┴──────────────────────┐                    │
│  │         PostgreSQL (SQLAlchemy 2.0)          │                    │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐   │                    │
│  │  │  Jobs   │  │ Drivers  │  │  Loads   │   │                    │
│  │  └─────────┘  └──────────┘  └──────────┘   │                    │
│  └──────────────────────────────────────────────┘                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Twilio    │  │  SendGrid   │  │  Firebase   │                 │
│  │   (SMS)     │  │  (Email)    │  │  (Push)     │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Platform Details

### 1. Web Frontend (Next.js)

- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS + CSS variables for PHI brand palette
- **Images:** `next/image` with remote patterns configured for GitHub user-attachments
- **Entry Points:**
  - `app/page.tsx` — Landing page (marketing site)
  - `app/layout.tsx` — Root layout with metadata
- **Components:** Shared in `app/components/`

### 2. Mobile App (Expo)

- **Framework:** Expo SDK 52 + React Native 0.76
- **Navigation:** React Navigation (stack + bottom tabs)
- **State:** Zustand (lightweight, no provider boilerplate)
- **Key Screens:**
  - Dashboard — KPI cards + AI Command Center
  - Loads — Load board with scoring
  - Earnings — Profit tracking + projections
  - Compliance — HOS + DOT audit
- **Build:** EAS (Expo Application Services) for Android APK / AAB

### 3. Backend (FastAPI + CrewAI)

- **Framework:** FastAPI with auto-generated OpenAPI docs
- **AI Engine:** CrewAI + LangChain-OpenAI (GPT-4o)
- **Agent Architecture:** 15 specialized agents across 5 functional groups
- **Async Workflows:** BackgroundTasks + in-memory job store (upgrade to Redis + Celery for production)
- **Database:** SQLAlchemy 2.0 ORM with PostgreSQL in production
- **Messaging:** Twilio SMS, SendGrid Email, Firebase Cloud Messaging

---

## API Contract

### Core Workflow Endpoints

| Method | Endpoint | Description | Mobile Trigger |
|--------|----------|-------------|----------------|
| `POST` | `/api/v1/autonomous-booking` | Load Acquisition (async) | "Find Freight" button |
| `POST` | `/api/v1/active-transit` | Dispatch & Transit (async) | "Start Trip" button |
| `POST` | `/api/v1/post-delivery` | Post-Delivery Close (async) | "One-Tap Payday" |
| `GET` | `/api/v1/jobs/{job_id}` | Poll job status | Progress spinner |
| `GET` | `/api/v1/agents` | List all 15 agents | AI Command Center |
| `WS` | `/ws/{driver_id}` | Live activity + in-cab AI chat | Real-time dashboard |

### Data Flow (Autonomous Booking Example)

```
Mobile App
    │
    ▼ POST /api/v1/autonomous-booking
FastAPI
    │
    ├──▶ FreightNegotiator (CrewAI) ──▶ scans top 15 loads
    ├──▶ RiskAssessor (CrewAI) ───────▶ 5-dimension risk scoring
    ├──▶ LegalAuditor (CrewAI) ───────▶ contract clause audit
    ├──▶ FreightNegotiator (CrewAI) ──▶ rate negotiation, books best RPM
    └──▶ ComplianceOfficer (CrewAI) ──▶ HOS feasibility check
    │
    ▼ BackgroundTasks
    │
    ▼ Job Store ──▶ Poll GET /api/v1/jobs/{job_id}
    │
    ▼ Mobile App (result: load booked or rejected)
```

---

## Security Considerations

- **CORS:** Configured in `main.py` for development origins
- **Authentication:** None at this stage (roadmap: OAuth2 + JWT)
- **Secrets:** All API keys stored in `.env` (never committed)
- **Firebase:** Service account JSON base64-encoded for cloud deployment
- **Payments:** Stripe publishable key on mobile; Stripe secret key on backend

---

## Scalability Roadmap

| Phase | Change | When |
|-------|--------|------|
| 1 | In-memory job store → Redis + Celery | > 100 concurrent jobs |
| 2 | Single Uvicorn worker → Gunicorn + Uvicorn workers | Production deploy |
| 3 | SQLite → PostgreSQL | Production deploy (already supported) |
| 4 | Self-hosted → AWS ECS / Render | Production deploy |
| 5 | Add API Gateway + Rate Limiting | Public API launch |

---

*For deployment specifics, see `docs/deployment.md`.*
