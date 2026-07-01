# PHI App — Build & Deploy Guide

## Prerequisites

```bash
npm install -g eas-cli          # EAS Build CLI
eas login                        # Log in with your Expo account
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Required | Where to get it |
|---|---|---|
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | **Yes** | console.anthropic.com |
| `EXPO_PUBLIC_ORS_API_KEY` | No | openrouteservice.org (free) |
| `EXPO_PUBLIC_EIA_API_KEY` | No | eia.gov/opendata (free) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | stripe.com |

## Step 1 — Link Your Expo Project

```bash
eas init          # creates projectId in app.json extra.eas
```

Update `app.json` → `extra.eas.projectId` with the ID printed above.

## Step 2 — Build a Test APK (for your device)

This generates a downloadable APK you can install directly on your Android phone.

```bash
eas build --platform android --profile preview
```

EAS Build prints a URL when done. Download the APK and open it on your device.
No Play Store account needed for this step.

## Step 3 — Production AAB (for Google Play Store)

### 3a. One-time signing setup

```bash
eas credentials          # select Android → Production → Generate new keystore
```

EAS manages the keystore securely in the cloud. You never need to handle the .jks file manually.

### 3b. Build the AAB

```bash
eas build --platform android --profile production
```

### 3c. Google Play submission

1. Create the app in [Google Play Console](https://play.google.com/console)
   - Package name: `com.princehaulintelligence.app`
2. Generate a service-account key (Play Console → Setup → API access → Create service account)
3. Download the JSON key and save it as `mobile/google-play-key.json` (gitignored)
4. Upload to EAS as a secret:
   ```bash
   eas secret:create --name GOOGLE_PLAY_KEY --value "$(cat google-play-key.json)"
   ```
5. Submit to the Internal Testing track:
   ```bash
   eas submit --platform android --profile production
   ```

## Store Listing Copy (ready to paste into Play Console)

**Title:** PHI - Prince Haul Intelligence  
**Short description:** AI-powered trucking ops — load booking, compliance, routing & profit tracking.  
**Full description:**
> Prince Haul Intelligence helps owner-operators and small fleets find better freight, analyze routes, monitor Hours of Service, track documents, and understand profit in real time. PHI combines AI automation with clear dashboards so drivers, dispatchers, and fleet leaders can make faster decisions, reduce deadhead, and grow revenue with confidence.

**Category:** Business  
**Content rating:** Everyone  
**Privacy policy URL:** https://www.princehaulintelligence.com/privacy-policy  

## Required Screenshots (1080×1920 or 1242×2208)

1. Dashboard — KPI cards + AI Command Center button
2. Loads — filtered load board with Diamond/Gold/Standard scores
3. AI Command Center — Claude chat interface
4. Earnings — Net profit hero card + yearly projection
5. Compliance — HOS hours + DOT audit report

## Build Versions

| Profile | Output | Use case |
|---|---|---|
| `development` | APK | Expo dev client for debugging |
| `preview` | APK | Install directly on your device for testing |
| `production` | AAB | Google Play Store submission |
