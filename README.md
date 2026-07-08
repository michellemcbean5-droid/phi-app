# PHI Mobile App

Prince Haul Intelligence (PHI) is an Expo-based mobile app for owner-operators and fleet teams. It combines load discovery, route analysis, AI worker orchestration, compliance monitoring, profit tracking, subscription management, and document workflows inside a branded trucking operations dashboard.

## Project Overview

### Core capabilities
- 10-worker AI command center with live worker status, heartbeat visibility, and revenue impact tracking
- Load board automation with scoring, route analysis, and auto-booking (Claude-generated lane rate estimates in place of DAT's paid API)
- Earnings intelligence with net profit, RPM trend monitoring, yearly projection, and affiliate tracking
- Compliance, document, notification, vehicle, and subscription screens built for PHI production flows
- Real, free/low-cost API integrations — no mocks: OpenRouteService (routing), EIA Open Data (fuel prices), OpenStreetMap Overpass (truck stops), Expo push notifications, expo-location (HOS/GPS), Google Play Billing (subscriptions)

## Subscription Tiers & API Keys

PHI is free to use. The only thing that differs by tier is **who pays for AI**:

| Tier | Price | AI features |
|---|---|---|
| **Free** | $0/mo | BYOK — the driver enters their own free Anthropic API key in Settings → My API Keys (~2 min, no credit card). Without a key, AI workers still run on simpler built-in logic. |
| **Solo / Fleet / Enterprise** | $49 / $149 / $399 per mo | **Managed AI** — PHI runs Claude on the driver's behalf, no key setup. Requires deploying `backend/managed-ai-proxy` (see its README) and setting `EXPO_PUBLIC_MANAGED_AI_PROXY_URL` + `EXPO_PUBLIC_MANAGED_AI_SHARED_SECRET`. Without that backend deployed, paid tiers fall back to the same "add your own key" prompt as Free. |

Non-AI tier gating (truck limit, document storage, load-alert refresh rate) is defined in `mobile/src/utils/subscriptionGating.ts`.

### Testing every tier without a real purchase
Real upgrades go through Google Play Billing, which only works on a Play-installed build. To test each tier locally or in a sideloaded APK, redeem a promo code from the Subscription screen (`mobile/src/store/promoStore.ts`):

| Code | Tier | Trial length |
|---|---|---|
| `OWNER1TRUCK` | Solo | 14 days |
| `PHITEST` | Fleet | 7 days |
| `PHIFIRSTRUN` | Fleet | 30 days |
| `PHIFREE30` | Enterprise | 30 days |
| `PHIVIP` | Enterprise | 60 days |

Each code can only be redeemed once per install; clear app storage (or `usePromoStore`'s persisted state) to reuse one while testing.

### API keys reference
- **Anthropic (Claude)** — powers all 10 AI workers. Free tier: BYOK. Paid tiers: managed via the proxy above (needs its own `ANTHROPIC_API_KEY` set as a Cloudflare Worker secret, never shipped in the app).
- **OpenRouteService** (`EXPO_PUBLIC_ORS_API_KEY`, optional) — real truck routing; free tier 2,000 req/day at openrouteservice.org/dev. Falls back to a haversine estimate if unset. Customers can also enter their own in Settings.
- **EIA Open Data** (`EXPO_PUBLIC_EIA_API_KEY`, optional) — real diesel prices; totally free at eia.gov/opendata/register.php. Falls back to a cached national average if unset. Customers can also enter their own in Settings.
- No Stripe key, DAT API key, or Twilio credentials are needed — those integrations were replaced by Google Play Billing, Claude-generated rate estimates, and Expo push notifications respectively.

### Tech stack
- Expo + React Native + TypeScript
- React Navigation (stack + tabs)
- Zustand for global state
- Vitest for unit tests
- EAS for Android build and submission workflows

## Local Setup

1. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```
2. Start the Expo app:
   ```bash
   npm run start
   ```
3. Run TypeScript validation:
   ```bash
   npx tsc --noEmit
   ```
4. Run tests:
   ```bash
   npm run test
   ```

## Important Paths
- `mobile/src/screens/` — PHI app screens
- `mobile/src/workers/` — AI worker logic and orchestrators
- `mobile/src/store/` — Zustand stores
- `mobile/src/api/` — mock connector layer
- `mobile/eas.json` — EAS build profiles
- `.github/workflows/` — CI for TypeScript, Vitest, and Expo builds

## EAS Build Steps

1. Install the EAS CLI if needed:
   ```bash
   npm install -g eas-cli
   ```
2. Authenticate:
   ```bash
   eas login
   ```
3. From `mobile/`, run a preview Android build:
   ```bash
   eas build --platform android --profile preview
   ```
4. For production AAB generation:
   ```bash
   eas build --platform android --profile production
   ```

## Play Store Submission Guide

1. Create the Android listing with package name `com.princehaulintelligence.app`.
2. Add the Play service account key at `mobile/google-play-key.json`.
3. Review `mobile/GOOGLE_PLAY_CHECKLIST.md` for listing copy, screenshots, rating answers, and graphic specs.
4. Submit through EAS:
   ```bash
   eas submit --platform android --profile production
   ```

## Brand Notes
Use the PHI palette consistently:
- Royal Blue `#0057FF`
- Sunshine Yellow `#FFD93D`
- Charcoal Black `#1A1A1A`
- Money Green `#00C853`

## CI Workflows
- `tests.yml` runs Vitest on pushes and pull requests
- `expo-build.yml` runs dependency install, `tsc --noEmit`, and preview EAS build on pushes to `main`
