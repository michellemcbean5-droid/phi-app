# AI Agent Instructions — Prince Haul Intelligence (PHI)

> This repository is a **fullstack application** built with **Next.js** (web frontend), **Python FastAPI** (AI backend), and **Expo React Native** (mobile app).  
> All agents must respect the conventions of each stack before writing or modifying code.

---

## 1. Repository Overview

| Platform | Tech | Directory | Primary Language |
|----------|------|-----------|------------------|
| Web Frontend | Next.js 15 | `app/` | TypeScript |
| AI Backend | FastAPI + CrewAI | `backend/` | Python 3.11 |
| Mobile App | Expo + React Native | `mobile/` | TypeScript |

**Default branch:** `main`  
**License:** MIT

---

## 2. Next.js Agent Rules

<!-- BEGIN:nextjs-agent-rules -->

This version of Next.js has breaking changes — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

### Key Conventions
- App Router lives in `app/` (not `pages/`).
- Use `next/image` for all images; configure `next.config.ts` for remote patterns.
- Keep shared UI components in `app/components/`.
- Global styles go in `app/globals.css`.
- TypeScript strict mode is enabled.

---

## 3. Python Backend Agent Rules

### Key Conventions
- **FastAPI** application entry point is `backend/main.py`.
- **CrewAI** agents are defined in `backend/agents.py`.
- **Tasks / Workflows** are defined in `backend/tasks.py`.
- Use **Pydantic v2** for all request/response models.
- Use **SQLAlchemy 2.0** for database models in `backend/app/database.py`.
- Environment variables are loaded via `python-dotenv` from `backend/.env`.
- All new endpoints must include:
  - OpenAPI docstrings
  - Pydantic request/response models
  - A corresponding test in `backend/test_backend.py` or `tests/backend/`

### Python Style
- PEP 8 compliant; max line length 100.
- Use type hints everywhere.
- Use `async` / `await` for I/O-bound operations (DB, HTTP).

---

## 4. Mobile (Expo) Agent Rules

### Key Conventions
- Entry point is `mobile/App.tsx`.
- Navigation lives in `mobile/src/navigation/`.
- Screens live in `mobile/src/screens/`.
- Global state uses **Zustand** (stores in `mobile/src/store/`).
- API layer uses **Axios** (connectors in `mobile/src/api/`).
- Tests run with **Vitest** (`npm run test` in `mobile/`).
- EAS build profiles are in `mobile/eas.json`.

### Mobile Style
- Use the PHI palette consistently:
  - Royal Blue `#0057FF`
  - Sunshine Yellow `#FFD93D`
  - Charcoal Black `#1A1A1A`
  - Money Green `#00C853`

---

## 5. Cross-Platform API Contract

When adding a new feature that spans frontend, backend, and mobile:

1. **Design the API contract first** (Pydantic models in `backend/main.py`).
2. **Implement the backend endpoint** with tests.
3. **Implement the frontend page** or **mobile screen** that consumes it.
4. **Update documentation** in `docs/` and `README.md`.

### Health & Discovery Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /` | Service identity and version |
| `GET /health` | Uptime / load-balancer health check |
| `GET /api/v1/agents` | List all 15 CrewAI agents |

---

## 6. Testing Requirements

- **Backend:** `pytest backend/test_backend.py` or `pytest tests/backend/`
- **Web:** Add Vitest / Jest tests in `tests/frontend/`
- **Mobile:** `cd mobile && npm run test` (Vitest)
- **CI:** All tests must pass before merge. See `.github/workflows/ci.yml`.

---

## 7. Environment & Secrets

- Never commit `.env` files. They are already in `.gitignore`.
- Copy `backend/.env.example` to `backend/.env` for local backend development.
- Copy `.env.example` (root) to `.env` for frontend secrets if needed.
- All cloud API keys (OpenAI, Twilio, SendGrid, Firebase, Stripe) belong in the backend `.env`.
- Expo public variables use `EXPO_PUBLIC_*` prefix in `mobile/.env`.

---

## 8. Deployment Checklist

- [ ] Web: Vercel / Render / self-hosted (`next build`)
- [ ] Backend: Render (`deploy.sh render`) or AWS ECS (`deploy.sh aws`)
- [ ] Mobile: EAS Build (`eas build --platform android --profile production`)
- [ ] Docker: `docker compose up --build` in `backend/` for local stack

---

## 9. Communication Protocol

When this file is present, agents should:
1. Read the relevant section (Next.js, Python, or Mobile) before writing code.
2. Follow the cross-platform API contract for new features.
3. Run tests and type-checking before declaring a task complete.
4. Update `docs/` and `README.md` when user-facing behavior changes.

*Last updated: 2026-07-08*
