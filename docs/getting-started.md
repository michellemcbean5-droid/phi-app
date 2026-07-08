# Getting Started

Welcome to **Prince Haul Intelligence (PHI)**! This guide will walk you through setting up the entire fullstack application on your local machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Next.js web + Expo mobile |
| Python | 3.11+ | FastAPI backend |
| Git | latest | Source control |
| Docker | latest | Local PostgreSQL + backend stack |

---

## Quick Start (All Platforms)

### 1. Clone the Repository

```bash
git clone https://github.com/michellemcbean5-droid/phi-app.git
cd phi-app
```

### 2. Set Up the Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (choose your OS)
source .venv/bin/activate        # macOS / Linux
.venv\Scripts\Activate.ps1      # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 3. Set Up the Web Frontend

```bash
# From the project root
cd phi-app

npm install

# No .env needed for basic web dev (images use GitHub remote URLs)
```

### 4. Set Up the Mobile App

```bash
cd mobile

npm install

# Optional: copy env for API keys
cp .env.example .env
```

---

## Running in Development

You will need **three terminal windows** (or use `tmux` / `screen`):

### Terminal 1 — Backend

```bash
cd backend
source .venv/bin/activate   # or .venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at:
- `http://localhost:8000/docs` (Swagger UI)
- `http://localhost:8000/redoc` (ReDoc)

### Terminal 2 — Web Frontend

```bash
cd phi-app
npm run dev
```

Open `http://localhost:3000`

### Terminal 3 — Mobile App

```bash
cd mobile
npm run start
```

Scan the QR code with **Expo Go** on your phone, or press `a` for Android emulator / `i` for iOS simulator.

---

## Running with Docker (One-Command Stack)

If you prefer not to run PostgreSQL locally, use Docker Compose:

```bash
cd backend
cp .env.example .env
# Edit .env and set DB_PASSWORD and OPENAI_API_KEY

docker compose up --build
```

This brings up:
- PostgreSQL on `localhost:5432`
- FastAPI on `localhost:8000`

---

## Next Steps

1. **Read the API docs** at `http://localhost:8000/docs`
2. **Explore the mobile screens** in `mobile/src/screens/`
3. **Review the AI agents** in `backend/agents.py`
4. **Run tests** (see `tests/README.md` in each platform folder)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Ensure you activated the Python virtual environment |
| `npm install` fails | Delete `node_modules/` and `package-lock.json`, then retry |
| Expo Go won't connect | Ensure your phone and computer are on the same Wi-Fi network |
| Docker port conflict | Stop local PostgreSQL or change the port mapping in `docker-compose.yml` |

---

*For deployment instructions, see `docs/deployment.md`.*  
*For architecture details, see `docs/architecture.md`.*
