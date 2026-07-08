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
