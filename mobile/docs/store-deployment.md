# PHI App — Store Deployment Guide

This document covers step-by-step submission to Google Play Store and Apple App Store, plus EAS Build and Fastlane commands.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Play Store Submission](#google-play-store-submission)
3. [Apple App Store Submission](#apple-app-store-submission)
4. [EAS Build Commands](#eas-build-commands)
5. [Fastlane Commands](#fastlane-commands)
6. [Environment Setup](#environment-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Accounts Required

| Service | URL | Cost |
|---|---|---|
| Google Play Developer | https://play.google.com/console | $25 one-time |
| Apple Developer Program | https://developer.apple.com | $99/year |
| Expo Account | https://expo.dev | Free tier available |
| RevenueCat (optional) | https://revenuecat.com | Free tier |
| Sentry (optional) | https://sentry.io | Free tier |
| Firebase (optional) | https://firebase.google.com | Free tier |

### Install CLI Tools

```bash
npm install -g eas-cli
npm install -g fastlane

eas login          # Log in with Expo account
fastlane --version # Verify fastlane install
```

---

## Google Play Store Submission

### Step 1: Create the App in Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: **PHI - Prince Haul Intelligence**
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free (subscriptions are in-app)
4. Accept the Declarations

### Step 2: Set Up Signing

```bash
cd mobile
eas credentials   # Select Android → Production → Generate new keystore
```

EAS stores the keystore securely. You do not need to handle `.jks` files.

### Step 3: Upload an Internal Testing Build

```bash
eas build --platform android --profile production
```

This creates an `.aab` file. Once complete, download or submit directly.

### Step 4: Configure Subscription Products

In Play Console → Monetization → Products → Subscriptions, create:

| Product ID | Name | Base plan |
|---|---|---|
| `phi_solo_monthly` | Solo Plan | Monthly, $49.00 |
| `phi_fleet_monthly` | Fleet Plan | Monthly, $149.00 |
| `phi_enterprise_monthly` | Enterprise Plan | Monthly, $399.00 |

Make sure to enable the base plan and set the country/region availability.

### Step 5: Add License Testers

Play Console → Setup → License testing → Add your Google account(s).
This ensures test purchases do not charge real money.

### Step 6: Service Account for EAS Submit

1. Play Console → Setup → API access → Create service account
2. Grant access to **Release Manager** role
3. Download the JSON key → save as `mobile/google-play-key.json` (gitignored)
4. Upload to EAS as a secret:
   ```bash
   eas secret:create --name GOOGLE_PLAY_KEY --value "$(cat google-play-key.json)"
   ```

### Step 7: Submit to Internal Testing

```bash
# Build + submit in one command
eas build --platform android --profile production --auto-submit

# Or submit an existing build
eas submit --platform android --profile production
```

### Step 8: Promote to Production

1. Internal Testing → Review & roll out
2. Promote to Closed Testing → Alpha
3. Promote to Open Testing → Beta
4. Promote to Production

---

## Apple App Store Submission

### Step 1: Enroll in Apple Developer Program

Ensure your Apple ID is enrolled ($99/year) at https://developer.apple.com.

### Step 2: Register App ID & Bundle ID

Apple Developer Portal → Identifiers → App IDs:
- Bundle ID: `com.princehaulintelligence.app`
- Capabilities: Push Notifications, In-App Purchase, Background Modes

### Step 3: Create App in App Store Connect

App Store Connect → My Apps → Add New App:
- Name: **PHI - Prince Haul Intelligence**
- Primary language: English (US)
- Bundle ID: `com.princehaulintelligence.app`
- SKU: `phi-app-001`
- User Access: Full access

### Step 4: Configure App-Specific Password / API Key

For automated submission via EAS, create an App Store Connect API Key:

1. App Store Connect → Users and Access → Keys → App Store Connect API
2. Generate a new key with **Admin** role
3. Download the `.p8` file → save as `mobile/AuthKey.p8` (gitignored)
4. Note the **Issuer ID** and **Key ID**

Update `eas.json`:
```json
"ios": {
  "ascAppId": "YOUR_APP_ID",
  "ascApiKeyPath": "./AuthKey.p8",
  "ascApiKeyIssuerId": "YOUR_ISSUER_ID",
  "ascApiKeyId": "YOUR_KEY_ID",
  "ascTeamId": "YOUR_TEAM_ID"
}
```

### Step 5: Create Subscription Products

App Store Connect → Your App → Features → In-App Purchases → Create:

| Reference Name | Product ID | Type |
|---|---|---|
| Solo Monthly | phi_solo_monthly | Auto-Renewable Subscription |
| Fleet Monthly | phi_fleet_monthly | Auto-Renewable Subscription |
| Enterprise Monthly | phi_enterprise_monthly | Auto-Renewable Subscription |

Create a Subscription Group (e.g., "PHI Plans") and add all three products.

### Step 6: Add Sandbox Testers

App Store Connect → Users and Access → Sandbox Testers → Add

### Step 7: Build & Submit

```bash
# iOS production build
eas build --platform ios --profile production

# Build + auto-submit
eas build --platform ios --profile production --auto-submit
```

### Step 8: Complete App Store Listing

Fill in App Store Connect:
- Screenshots (see `docs/app-store-assets.md`)
- Description, keywords, support URL
- Privacy policy URL
- App Review Information (demo account if needed)

---

## EAS Build Commands

| Command | Purpose |
|---|---|
| `eas build --platform android --profile preview` | Debug APK for device testing |
| `eas build --platform android --profile production` | Release AAB for Play Store |
| `eas build --platform ios --profile production` | Release IPA for App Store |
| `eas build --platform all --profile production` | Both platforms |
| `eas build --platform android --profile production --auto-submit` | Build + submit to Play Store |
| `eas submit --platform ios --profile production` | Submit existing build to App Store |
| `eas credentials` | Manage signing certificates & keystores |
| `eas secret:create --name KEY --value "..."` | Create EAS environment secrets |

---

## Fastlane Commands

### Android

```bash
cd mobile

fastlane android test          # Run unit tests
fastlane android debug         # Build debug APK
fastlane android build         # Build release AAB
fastlane android deploy_internal  # Upload to Play (Internal)
fastlane android promote_alpha    # Promote Internal → Alpha
fastlane android promote_production # Promote Alpha → Production
fastlane android screenshots   # Automated screenshot capture
```

### iOS

```bash
cd mobile

fastlane ios test              # Run tests
fastlane ios build             # Build & archive
fastlane ios beta              # Upload to TestFlight
fastlane ios deploy            # Submit to App Store review
fastlane ios screenshots       # Automated screenshot capture
```

---

## Environment Setup

Copy `.env.example` to `.env` and fill in all keys:

```bash
cp .env.example .env
```

For CI/CD (GitHub Actions), set these as repository secrets:

| Secret | Description |
|---|---|
| `EXPO_TOKEN` | Expo access token (get from expo.dev/settings/access-tokens) |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps upload |
| `GOOGLE_PLAY_KEY` | Contents of `google-play-key.json` |
| `FASTLANE_APPLE_ID` | Apple ID email for fastlane |
| `FASTLANE_TEAM_ID` | Apple Developer Team ID |
| `FASTLANE_ITC_TEAM_ID` | App Store Connect Team ID |
| `MATCH_PASSWORD` | Fastlane Match encryption password (if using Match) |

---

## Troubleshooting

### EAS Build Failures

**Issue:** `Gradle build failed`
- **Fix:** Check `android/build.gradle` and ensure `compileSdkVersion` matches `app.json` (35)
- Run locally: `expo prebuild --platform android && cd android && ./gradlew assembleRelease`

**Issue:** `Keystore not found`
- **Fix:** Run `eas credentials` and generate a new keystore for the production profile.

**Issue:** `iOS signing certificate error`
- **Fix:** Ensure your Apple Developer account is active and the bundle ID is registered.
- Use `eas credentials` to manage iOS certificates.

### Store Submission Failures

**Issue:** Google Play rejects AAB with "You need to use a different package name"
- **Fix:** The package name `com.princehaulintelligence.app` must be unique globally. Ensure it matches `app.json` exactly.

**Issue:** App Store rejects with "Missing required icon"
- **Fix:** Verify `assets/icon.png` is 1024×1024 and `assets/adaptive-icon.png` exists.

**Issue:** In-app purchases not working in TestFlight
- **Fix:** Ensure sandbox tester is created in App Store Connect and you are signed out of your real Apple ID on the test device.

### AdMob Issues

**Issue:** Ads not showing in development
- **Fix:** AdMob uses test IDs in dev mode. If you see "No fill" errors, that's normal in development.

**Issue:** `MobileAds.initialize()` crashes
- **Fix:** Ensure `ADMOB_APP_ID_ANDROID` / `ADMOB_APP_ID_IOS` are set in `.env` and match your AdMob account.

### RevenueCat Issues

**Issue:** Offerings return empty
- **Fix:** Check RevenueCat Dashboard → Products & Entitlements. Ensure products are configured and the API key is correct.
- Verify the app is installed through TestFlight / Play (not sideloaded) for real purchases.

---

## Quick Reference Checklist

### Before First Release

- [ ] Google Play Console app created
- [ ] Apple App Store Connect app created
- [ ] Bundle ID / Package name registered on both platforms
- [ ] Subscription products created (3 tiers on both stores)
- [ ] Keystore generated (Android)
- [ ] iOS certificates & provisioning profiles created
- [ ] `.env` file created with all keys
- [ ] EAS secrets configured
- [ ] GitHub Actions secrets configured
- [ ] Screenshots captured for all required sizes
- [ ] Privacy policy live on website
- [ ] Terms of service live on website
- [ ] Support email configured
- [ ] Content rating questionnaire completed (Play Console)
- [ ] App Review demo account created (App Store)
