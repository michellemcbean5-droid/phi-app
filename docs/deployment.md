# Deployment Guide

This document covers deploying **Prince Haul Intelligence (PHI)** across all three platforms: Web, Backend, and Mobile.

---

## 1. Web Frontend (Next.js)

### Option A: Vercel (Recommended)

1. Connect your GitHub repo to [Vercel](https://vercel.com).
2. Set framework preset to **Next.js**.
3. Add environment variables if needed (see `.env.example`).
4. Push to `main` — Vercel auto-deploys.

### Option B: Render Static Site

1. Create a new **Static Site** on [Render](https://render.com).
2. Build command: `npm run build`
3. Publish directory: `out` or `.next`
4. Add environment variables in Render dashboard.

### Option C: Self-Hosted

```bash
npm run build
npm run start
# Serves on localhost:3000
```

---

## 2. Backend (FastAPI + CrewAI)

### Option A: Render (Recommended for Zero-Infra)

```bash
cd backend
./deploy.sh render
```

Or manually:
1. Create a new **Web Service** on [Render](https://render.com).
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4`
4. Add all environment variables from `.env.example`.
5. Add a **PostgreSQL** database (Render free tier includes one).
6. Connect the database URL to `DATABASE_URL` env var.

### Option B: AWS ECS Fargate

```bash
cd backend
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=123456789012
export ECR_REPO=phi-backend
export ECS_CLUSTER=phi-cluster
export ECS_SERVICE=phi-api
./deploy.sh aws
```

Prerequisites:
- AWS CLI configured with credentials
- ECR repository created
- ECS cluster and service defined
- ALB (Application Load Balancer) pointing to ECS service

### Option C: Docker Compose (Local / On-Premise)

```bash
cd backend
cp .env.example .env
# Edit .env with production secrets

docker compose up --build -d
```

This brings up:
- PostgreSQL 15 on port `5432`
- FastAPI on port `8000`

Health check: `curl http://localhost:8000/health`

---

## 3. Mobile App (Expo)

### Prerequisites

```bash
npm install -g eas-cli
eas login
```

### Step 1 — Preview APK (Testing)

```bash
cd mobile
eas build --platform android --profile preview
```

Downloads a test APK you can install directly on your Android device.

### Step 2 — Production AAB (Google Play Store)

```bash
cd mobile
eas build --platform android --profile production
```

Generates an `.aab` file for Play Store submission.

### Step 3 — Submit to Play Store

```bash
eas submit --platform android --profile production
```

Requirements:
- Play Console app created with package `com.princehaulintelligence.app`
- Service account key at `mobile/google-play-key.json` (gitignored)
- EAS secret configured: `eas secret:create --name GOOGLE_PLAY_KEY --value "$(cat google-play-key.json)"`

See `mobile/BUILD.md` and `mobile/GOOGLE_PLAY_CHECKLIST.md` for full store listing copy, screenshots, and rating answers.

---

## 4. Environment Variables Checklist

### Backend (Required for Production)

| Variable | Source | Required? |
|----------|--------|-----------|
| `OPENAI_API_KEY` | [OpenAI](https://platform.openai.com/api-keys) | **Yes** |
| `OPENAI_MODEL` | `gpt-4o` (recommended) | Yes |
| `DATABASE_URL` | Render Postgres / AWS RDS | Yes |
| `TWILIO_ACCOUNT_SID` | [Twilio](https://www.twilio.com/try-twilio) | No |
| `TWILIO_AUTH_TOKEN` | Twilio Console | No |
| `SENDGRID_API_KEY` | [SendGrid](https://signup.sendgrid.com) | No |
| `FIREBASE_SERVICE_ACCOUNT_B64` | [Firebase Console](https://console.firebase.google.com) | No |

### Mobile (Optional)

| Variable | Source | Required? |
|----------|--------|-----------|
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | [Anthropic](https://console.anthropic.com) | No |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [Stripe](https://stripe.com) | No |

---

## 5. CI/CD Pipeline

GitHub Actions workflows are defined in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to `main`/`develop` | Matrix CI: Node.js + Python + Docker |
| `tests.yml` | Push/PR | Mobile Vitest |
| `expo-build.yml` | Push to `main` | EAS Android APK build |
| `dependency-review.yml` | PR to `main` | Security vulnerability scanning |

All workflows must pass before merging to `main`.

---

## 6. Rollback Strategy

| Platform | Rollback Method |
|----------|-----------------|
| Web (Vercel) | Re-deploy previous commit from Vercel dashboard |
| Web (Render) | Git revert + push; Render auto-deploys |
| Backend (Render) | Render dashboard → Manual Deploy → previous commit |
| Backend (AWS ECS) | Update service with previous ECR image tag |
| Mobile (EAS) | Submit previous build from EAS builds list |

---

*For local development setup, see `docs/getting-started.md`.*  
*For architecture details, see `docs/architecture.md`.*
