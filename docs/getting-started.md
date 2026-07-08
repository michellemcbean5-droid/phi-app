# Getting Started with PHI

> Quick start guide for new developers joining the Prince Haul Intelligence project.

---

## 1. Prerequisites

| Tool | Version | Install Link |
|------|---------|-------------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Python | 3.11+ | [python.org](https://python.org) |
| Git | Latest | [git-scm.com](https://git-scm.com) |
| Docker | (Optional) | [docker.com](https://docker.com) |
| Expo Go | (Mobile testing) | [expo.dev](https://expo.dev) |

---

## 2. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/michellemcbean5-droid/phi-app.git
cd phi-app

# Install root dependencies (Next.js web)
npm install

# Install mobile dependencies
cd mobile
npm install
cd ..

# Setup backend (optional, for local AI backend)
cd backend
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cd ..
```

---

## 3. Environment Variables

### Mobile App (`mobile/.env`)

Copy the example file:

```bash
cd mobile
cp .env.example .env
```

Minimum required for full functionality:

```env
# AI (required for AI features)
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional but recommended
EXPO_PUBLIC_ORS_API_KEY=your_ors_key
EXPO_PUBLIC_EIA_API_KEY=your_eia_key

# For billing (production only)
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your_rc_android_key
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your_rc_ios_key

# For ads (production only)
EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=your_admob_app_id
EXPO_PUBLIC_ADMOB_APP_ID_IOS=your_admob_app_id

# For crash reporting (production only)
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

**Getting free API keys:**
- **Anthropic (Claude AI):** [console.anthropic.com](https://console.anthropic.com) — Free $5 credit on signup
- **OpenRouteService:** [openrouteservice.org/dev](https://openrouteservice.org/dev) — Free 2,000 requests/day
- **EIA (Fuel Prices):** [eia.gov/opendata/register.php](https://eia.gov/opendata/register.php) — Free, no credit card

### Backend (`backend/.env`)

```bash
cd backend
cp .env.example .env
```

```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
PORT=8000
ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/phi_db
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=invoices@yourcompany.com
FIREBASE_SERVICE_ACCOUNT_B64=...
```

---

## 4. Running the App

### Web Frontend (Next.js)

```bash
# From project root
npm run dev

# Open http://localhost:3000
```

### Mobile App (Expo)

```bash
cd mobile

# Start Expo development server
npm run start

# Options:
# - Scan QR code with Expo Go app (iOS/Android)
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Press 'w' for web browser
```

### Backend (FastAPI)

```bash
cd backend
.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate  # macOS/Linux

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or
python main.py

# Open API docs:
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

### Docker (Full Stack)

```bash
cd backend
cp .env.example .env
# Edit .env with your keys

docker compose up --build
```

---

## 5. Project Structure

```
phi-app/
├── app/                    # Next.js web frontend
│   ├── components/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── backend/                # Python FastAPI + CrewAI
│   ├── main.py
│   ├── agents.py
│   ├── tasks.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
├── mobile/                 # Expo React Native app
│   ├── App.tsx
│   ├── src/
│   │   ├── screens/       # 20+ app screens
│   │   ├── workers/       # AI worker logic
│   │   ├── store/         # Zustand state stores
│   │   ├── api/           # API connectors
│   │   ├── components/    # Reusable UI components
│   │   ├── config/        # Analytics, billing config
│   │   ├── utils/         # Business logic utilities
│   │   └── middleware/    # Auth middleware
│   ├── assets/
│   ├── eas.json           # EAS build profiles
│   └── package.json
├── tests/                  # Test suites
├── docs/                   # Documentation
└── .github/workflows/     # CI/CD
```

---

## 6. Development Workflow

### Branch Strategy

```
main          # Production-ready code
├── develop   # Integration branch (optional)
├── feature/  # Feature branches
├── fix/      # Bug fix branches
└── docs/     # Documentation updates
```

### Making Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make changes** following conventions in `AGENTS.md`

3. **Run tests:**
   ```bash
   # Mobile tests
   cd mobile
   npm run test
   
   # Backend tests
   cd backend
   pytest test_backend.py
   
   # TypeScript check
   cd mobile
   npx tsc --noEmit
   ```

4. **Commit:**
   ```bash
   git add -A
   git commit -m "feat: add new load scoring algorithm"
   ```

5. **Push and open PR:**
   ```bash
   git push origin feature/my-new-feature
   ```

---

## 7. Key Conventions

### Mobile (Expo)

- **Entry point:** `mobile/App.tsx`
- **Screens:** `mobile/src/screens/` — one file per screen
- **State:** Zustand stores in `mobile/src/store/`
- **APIs:** Connectors in `mobile/src/api/`
- **Colors:** Import from `mobile/src/assets/brandColors.ts`
- **Tests:** `mobile/src/__tests__/*.test.ts` (Vitest)

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `DashboardScreen.tsx` |
| Stores | camelCase + `Store` | `useAuthStore.ts` |
| API files | camelCase | `claudeClient.ts` |
| Utils | camelCase | `profitFormula.ts` |
| Types | PascalCase | `LoadScore`, `UserTier` |
| Constants | UPPER_SNAKE | `PHI_COLORS`, `MAX_DRIVE_HOURS` |

### Color Palette

```typescript
import { PHI_COLORS } from './src/assets/brandColors';

// Primary
PHI_COLORS.royalBlue      // #0057FF — Headers, primary buttons
PHI_COLORS.sunshineYellow // #FFD93D — CTAs, badges, highlights
PHI_COLORS.moneyGreen     // #00C853 — Success, profit, active status

// Neutrals
PHI_COLORS.charcoalBlack  // #1A1A1A — Text on light backgrounds
PHI_COLORS.surface        // #0A1628 — Screen backgrounds
PHI_COLORS.card           // #0D1F3C — Card backgrounds
PHI_COLORS.white          // #FFFFFF — Primary text
```

---

## 8. Testing

### Running Tests

```bash
# Mobile unit tests
cd mobile
npm run test

# Watch mode
cd mobile
npm run test:watch

# Backend tests
cd backend
pytest test_backend.py -v

# Web linting
npm run lint
```

### Test Coverage Areas

| Area | Framework | Files |
|------|-----------|-------|
| Business logic | Vitest | `src/__tests__/*.test.ts` |
| API connectors | Vitest (mocked) | `src/__tests__/*.test.ts` |
| State management | Vitest | `src/__tests__/*.test.ts` |
| Backend | pytest | `backend/test_backend.py` |
| E2E | (Future: Detox) | — |

---

## 9. Common Issues

### "Module not found" when running mobile

```bash
cd mobile
rm -rf node_modules package-lock.json
npm install
```

### "API key not working" in AI features

1. Check `mobile/.env` has `EXPO_PUBLIC_ANTHROPIC_API_KEY`
2. Restart Expo dev server after changing `.env`
3. Verify key at [console.anthropic.com](https://console.anthropic.com)

### "Build fails on Android"

```bash
cd mobile
npx expo prebuild --clean
npx expo run:android
```

### "Play Billing not working"

- Play Billing only works on Android devices with Google Play Services
- Must be installed via Play Store (not sideloaded APK)
- Use Internal Testing track for testing

---

## 10. Resources

### Documentation
- `README.md` — Project overview
- `AGENTS.md` — AI agent rules and conventions
- `docs/architecture.md` — System design
- `docs/api-reference.md` — API documentation
- `docs/monetization.md` — Pricing and tiers
- `docs/competitor-analysis.md` — Market analysis
- `docs/user-simulation.md` — UX research

### External Links
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Zustand](https://github.com/pmndrs/zustand)
- [FastAPI](https://fastapi.tiangolo.com)
- [CrewAI](https://docs.crewai.com)

---

*Last updated: 2026-07-08*
