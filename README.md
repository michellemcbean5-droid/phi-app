# PHI Mobile App

Prince Haul Intelligence (PHI) is an Expo-based mobile app for owner-operators and fleet teams. It combines load discovery, route analysis, AI worker orchestration, compliance monitoring, profit tracking, subscription management, and document workflows inside a branded trucking operations dashboard.

## Project Overview

### Core capabilities
- 15-worker AI command center with live worker status, heartbeat visibility, and revenue impact tracking
- Load board automation for DAT and Truckstop-style feeds with scoring, route analysis, and auto-booking
- Earnings intelligence with net profit, RPM trend monitoring, yearly projection, and affiliate tracking
- Compliance, document, notification, vehicle, and subscription screens built for PHI production flows
- Mock API connectors for DAT, Google Maps, Twilio, Stripe, and Samsara integrations

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
