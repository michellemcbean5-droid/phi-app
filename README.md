# Prince Haul Intelligence (PHI)

**Prince Haul Intelligence** is a fullstack AI-powered trucking platform for owner-operators and fleet teams. It combines a Next.js marketing web app, a Python FastAPI + CrewAI backend, and an Expo React Native mobile app into a single autonomous ecosystem.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Web (Next.js)](#web-nextjs)
  - [Backend (Python FastAPI)](#backend-python-fastapi)
  - [Mobile (Expo React Native)](#mobile-expo-react-native)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

PHI is built to automate the entire trucking lifecycle:
- **15-agent AI command center** with live worker status, heartbeat visibility, and revenue impact tracking
- **Load board automation** for DAT and Truckstop-style feeds with scoring, route analysis, and auto-booking
- **Earnings intelligence** with net profit, RPM trend monitoring, yearly projection, and affiliate tracking
- **Compliance, document, notification, vehicle, and subscription screens** built for PHI production flows
- **Mock API connectors** for DAT, Google Maps, Twilio, Stripe, Samsara integrations
- **Customer acquisition lifecycle** with a consented PHI assessment form, qualification rules, protected deal stages, onboarding gates, and an append-only audit ledger

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Web Frontend** | Next.js 15 + React + TypeScript + Tailwind CSS |
| **Backend API** | Python 3.11 + FastAPI + CrewAI + LangChain-OpenAI |
| **Mobile App** | Expo + React Native + TypeScript + Zustand |
| **Database** | PostgreSQL (production) / SQLite (dev) |
| **Messaging** | Twilio SMS, SendGrid Email, Firebase Push |
| **CI/CD** | GitHub Actions |
| **Containerization** | Docker + Docker Compose |

---

## Repository Structure

```
phi-app/
├── app/                        # Next.js web app (App Router)
│   ├── components/             # Shared React components
│   ├── page.tsx                # Landing page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── backend/                    # Python FastAPI + CrewAI backend
│   ├── main.py                 # FastAPI entry point
│   ├── agents.py               # 15 CrewAI agents
│   ├── tasks.py                # Multi-agent workflow builders
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile              # Production container
│   ├── docker-compose.yml      # Local production stack
│   ├── deploy.sh               # Deploy script (Render / AWS)
│   ├── test_backend.py         # Backend tests
│   ├── .env.example            # Backend env template
│   └── app/                    # SQLAlchemy ORM models
├── mobile/                     # Expo React Native app
│   ├── App.tsx                 # Root component
│   ├── src/
│   │   ├── screens/            # PHI app screens
│   │   ├── workers/            # AI worker logic
│   │   ├── store/              # Zustand stores
│   │   └── api/                # Mock connector layer
│   ├── assets/                 # Icons & splash images
│   ├── eas.json                # EAS build profiles
│   ├── BUILD.md                # Build & deploy guide
│   └── package.json
├── tests/                      # Test suites
│   ├── frontend/               # Next.js / web tests
│   └── backend/                # Python backend tests
├── docs/                       # Documentation
│   ├── getting-started.md
│   ├── architecture.md
│   └── deployment.md
├── .github/workflows/          # CI/CD workflows
│   ├── ci.yml                  # Unified CI (Node + Python matrix)
│   ├── tests.yml               # Mobile Vitest
│   ├── expo-build.yml          # EAS Android build
│   └── dependency-review.yml   # Security scanning
├── .env.example                # Root env template (if any)
├── README.md                   # This file
├── AGENTS.md                   # AI agent rules & conventions
├── CLAUDE.md                   # Claude-specific notes
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── package.json                # Root package scripts
├── next.config.ts              # Next.js config
├── tsconfig.json               # TypeScript config
└── eslint.config.mjs           # ESLint config
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (with npm)
- **Python** 3.11+ (with pip)
- **Git**
- **Docker** (optional, for local backend stack)
- **Expo Go** app (optional, for mobile testing on device)

---

### Web (Next.js)

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
# or
npx next dev

# Open http://localhost:3000
```

#### Web scripts (from root `package.json`)
| Script | Command |
|--------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

### Backend (Python FastAPI)

```bash
cd backend

# Create a virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1
# Activate (macOS / Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your OpenAI API key and other secrets

# Run the development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# or
python main.py
```

#### Backend endpoints
| URL | Description |
|-----|-------------|
| `http://localhost:8000/docs` | Swagger UI — interactive API explorer |
| `http://localhost:8000/redoc` | ReDoc — clean reference documentation |
| `http://localhost:8000/health` | Health check endpoint |
| `http://localhost:8000/api/v1/agents` | All 15 CrewAI agents |
| `POST /api/v1/customer-journey/leads` | Public, consented PHI assessment intake |
| `GET /api/v1/customer-journey/leads` | Protected customer-operations pipeline view |
| `PATCH /api/v1/customer-journey/leads/{lead_id}/stage` | Protected, audited deal-stage update |
| `PATCH /api/v1/customer-journey/leads/{lead_id}/onboarding` | Protected onboarding transition after a verified win |

#### Customer Journey Configuration

The Next.js lead route relays assessment submissions to `PHI_CUSTOMER_API_URL` on the server. The FastAPI service must set `PHI_ADMIN_TOKEN` before staff-only pipeline, deal-stage, and onboarding endpoints are available. Keep both values in the deployment secret manager; do not expose the admin token to browsers. The public intake endpoint stores only an explicit-consent assessment and never sends messages, accepts payments, or changes a deal to won by itself.

The private free sales workspace lives at `/operations`. Configure `PHI_OPERATIONS_ACCESS_KEY` in the web deployment and enter that key only in the private workspace. The server-side Operations gateway also requires `PHI_CUSTOMER_API_URL` and `PHI_ADMIN_TOKEN`; neither secret is exposed to the browser. The workspace shows the consented lead pipeline, prepared follow-up queue, consultation handoffs, source counts, and **verified** recurring revenue rather than counting opportunities as revenue.

The free Google delivery bridge uses the same public PHI site at `/api/automation/*`. Configure a separate `PHI_AUTOMATION_ACCESS_KEY` in the web environment and the Google Script properties. This restricted key can retrieve `ready` follow-ups and write delivery receipts only; it cannot list all leads, move deal stages, begin onboarding, record revenue, or access the PHI admin token. See [`docs/single-domain-deployment.md`](docs/single-domain-deployment.md) for the one-domain route map and deployment variables.

For consented customer email, set `PHI_BUSINESS_MAILING_ADDRESS` in the FastAPI deployment. PHI currently uses `1642 McCulloch Blvd, Unit 466, Lake Havasu City, Arizona`. New prepared assessment responses include this identity and a reply-based opt-out instruction. The application never treats a follow-up as sent until an authorized delivery provider returns a delivery identifier.

#### Backend Docker (local production stack)
```bash
cd backend

# Copy and edit env
cp .env.example .env

# Start PostgreSQL + FastAPI
docker compose up --build
```

---

### Mobile (Expo React Native)

```bash
cd mobile

# Install dependencies
npm install

# Start the Expo dev server
npm run start

# Scan the QR code with Expo Go (iOS/Android)
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

#### Mobile scripts
| Script | Command |
|--------|---------|
| `npm run start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Run in web browser |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |

#### EAS Build (Android)
```bash
# Install EAS CLI if needed
npm install -g eas-cli

# Login
eas login

# Preview APK (for testing)
eas build --platform android --profile preview

# Production AAB (for Play Store)
eas build --platform android --profile production
```

---

## Running Tests

### Web / Frontend
```bash
# From root (if frontend tests are configured)
# or add a test script to root package.json
```

### Backend
```bash
cd backend
pytest test_backend.py
# or
pytest tests/backend/
```

### Mobile
```bash
cd mobile
npm run test
# or
npx vitest run
```

### TypeScript Validation
```bash
# Web
npx tsc --noEmit

# Mobile
cd mobile
npx tsc --noEmit
```

---

## Deployment

### Web (Next.js)
- **Vercel:** Connect GitHub repo, auto-deploy on push to `main`.
- **Render:** Use `deploy.sh render` or configure a static site.
- **Self-hosted:** Run `npm run build` and serve `out/` or `.next/`.

### Backend (FastAPI)
- **Render:** `./deploy.sh render` (recommended — zero-infra, free Postgres).
- **AWS ECS:** `./deploy.sh aws` (requires AWS CLI, ECR, ECS cluster).
- **Docker:** `docker compose up --build` in `backend/`.

### Mobile (Expo)
- **EAS Build:** `eas build --platform android --profile production`
- **Play Store Submission:** `eas submit --platform android --profile production`
- See `mobile/BUILD.md` and `mobile/GOOGLE_PLAY_CHECKLIST.md` for full details.

---

## Environment Variables

### Backend (`backend/.env`)
```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
PORT=8000
ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/phi_db
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+1...
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=invoices@yourcompany.com
FIREBASE_SERVICE_ACCOUNT_B64=
```

### Mobile (`mobile/.env`)
```env
EXPO_PUBLIC_ANTHROPIC_API_KEY=...
EXPO_PUBLIC_ORS_API_KEY=...
EXPO_PUBLIC_EIA_API_KEY=...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

> **Security note:** Never commit `.env` files. They are already in `.gitignore`.

---

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the conventions in `AGENTS.md` for your stack (Next.js, Python, or Mobile).
3. Run tests and type-checking before opening a PR.
4. Update `docs/` and `README.md` if user-facing behavior changes.
5. Open a pull request against `main`.

See `CONTRIBUTING.md` for detailed guidelines.

---

## License

MIT © Prince Haul Intelligence
