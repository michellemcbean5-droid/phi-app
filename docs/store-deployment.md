# Store Deployment Guide

> Step-by-step guide for deploying the Prince Haul Intelligence mobile app to the Apple App Store and Google Play Store.

---

## 1. Pre-Deployment Checklist

### App Store Requirements (iOS)

- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect app record created
- [ ] Bundle ID registered: `com.princehaulintelligence.app`
- [ ] App icon (1024×1024 PNG)
- [ ] Screenshots for iPhone (6.5", 5.5", iPad)
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] App description (max 4000 characters)
- [ ] Keywords (max 100 characters)
- [ ] Support URL
- [ ] Marketing URL (optional)

### Play Store Requirements (Android)

- [ ] Google Play Developer Account ($25 one-time)
- [ ] App created in Play Console
- [ ] Package name: `com.princehaulintelligence.app`
- [ ] App icon (512×512 PNG)
- [ ] Feature graphic (1024×500 PNG)
- [ ] Screenshots (phone, tablet, Android TV)
- [ ] Privacy policy URL
- [ ] App description (short: 80 chars, full: 4000 chars)
- [ ] Content rating questionnaire completed
- [ ] Target countries selected
- [ ] Pricing set (free with subscriptions)

### PHI-Specific Requirements

- [ ] RevenueCat products configured (iOS + Android)
- [ ] Google Play subscription products created (`phi_solo_monthly`, `phi_fleet_monthly`, `phi_enterprise_monthly`)
- [ ] AdMob app registered (iOS + Android)
- [ ] Sentry project created
- [ ] Firebase project created (optional)
- [ ] Backend API deployed and accessible
- [ ] Terms of service page live
- [ ] Privacy policy page live
- [ ] Support email configured

---

## 2. Environment Setup

### Production Environment Variables

Create `mobile/.env.production`:

```env
# AI
EXPO_PUBLIC_ANTHROPIC_API_KEY=

# Routing (optional for production)
EXPO_PUBLIC_ORS_API_KEY=

# Fuel (optional for production)
EXPO_PUBLIC_EIA_API_KEY=

# RevenueCat (REQUIRED)
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_xxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_xxxxxxxxxxxx

# AdMob (REQUIRED for ads)
EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx
EXPO_PUBLIC_ADMOB_APP_ID_IOS=ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx

# Sentry (REQUIRED for crash reporting)
EXPO_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxxxx.ingest.sentry.io/xxxxxxx

# Firebase (optional)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=

# Backend (REQUIRED)
EXPO_PUBLIC_API_BASE_URL=https://api.princehaulintelligence.com/v1
EXPO_PUBLIC_WS_URL=wss://api.princehaulintelligence.com/ws

# Feature flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_ADS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
EXPO_PUBLIC_ENABLE_BILLING_SANDBOX=false
```

---

## 3. Build Configuration

### EAS Build Profiles (`mobile/eas.json`)

```json
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "local" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      },
      "ios": {
        "enterpriseProvisioning": "adhoc"
      },
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "internal",
        "releaseStatus": "draft"
      },
      "ios": {
        "ascAppId": "",
        "ascApiKeyPath": "./AuthKey.p8",
        "ascApiKeyIssuerId": "",
        "ascApiKeyId": "",
        "ascTeamId": ""
      }
    }
  }
}
```

### App Configuration (`mobile/app.json`)

Already configured with:
- Bundle ID: `com.princehaulintelligence.app`
- Permissions: Location, Camera, Notifications, Storage
- Dark theme, portrait orientation
- Expo SDK 52, React Native 0.76.9

---

## 4. Building for Android

### Step 1: Preview APK (Internal Testing)

```bash
cd mobile

# Login to EAS
eas login

# Build preview APK
eas build --platform android --profile preview

# Download APK from EAS dashboard
# Install on device: adb install ./path/to/app.apk
```

### Step 2: Production AAB (Play Store)

```bash
# Build production AAB
eas build --platform android --profile production

# Or with auto-submit (after configuring submit.production.android)
eas build --platform android --profile production --auto-submit
```

### Step 3: Google Play Console Setup

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create app → "Prince Haul Intelligence"
3. Set up app → Store listing
4. Upload AAB from EAS build
5. Create subscription products:
   - `phi_solo_monthly` — $49.99 USD
   - `phi_fleet_monthly` — $149.99 USD
   - `phi_enterprise_monthly` — $399.99 USD
6. Add license testers for internal testing
7. Release to Internal Testing → Closed Testing → Open Testing → Production

### Step 4: Fastlane (Optional)

```bash
cd mobile
fastlane android beta    # Upload to beta track
fastlane android deploy  # Upload to production
```

---

## 5. Building for iOS

### Step 1: Preview Build (Internal Distribution)

```bash
cd mobile

# Build for device (requires Apple Developer account)
eas build --platform ios --profile preview

# Or for simulator (no Apple account needed)
eas build --platform ios --profile development
```

### Step 2: Production Build (App Store)

```bash
# Build and submit to App Store
eas build --platform ios --profile production

# Or with auto-submit
eas build --platform ios --profile production --auto-submit
```

### Step 3: App Store Connect Setup

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create app → "Prince Haul Intelligence"
3. Set bundle ID: `com.princehaulintelligence.app`
4. Upload build from EAS (or use Transporter app)
5. Configure App Store subscriptions:
   - Solo Monthly — $49.99
   - Fleet Monthly — $149.99
   - Enterprise Monthly — $399.99
6. Fill in App Store listing:
   - Screenshots (6.5", 5.5", iPad)
   - Description, keywords, support URL
   - Privacy policy URL
   - App Review information
7. Submit for review

### Step 4: Fastlane (Optional)

```bash
cd mobile
fastlane ios beta      # Upload to TestFlight
fastlane ios release   # Submit to App Store review
```

---

## 6. Store Listing Content

### App Title
**Prince Haul Intelligence** — AI Trucking Dispatch

### Short Description (Android, 80 chars)
AI-powered trucking app: find loads, book freight, track earnings, stay compliant.

### Full Description
```
Prince Haul Intelligence (PHI) is the AI-powered trucking app that runs your entire business while you drive.

🤖 10 AI WORKERS AUTOMATE EVERYTHING
• Freight Negotiator — scans load boards and negotiates rates
• Route Optimizer — plans the safest, most efficient routes
• Compliance Officer — monitors HOS and prevents DOT violations
• Invoice Specialist — generates invoices instantly on delivery
• Fuel Optimizer — finds cheapest diesel stops along your route
• And 5 more workers handling dispatch, documents, tracking, and analytics

📦 LOAD BOARD & BOOKING
• AI-generated loads with Diamond/Gold/Standard scoring
• One-tap booking with automatic rate negotiation
• Real-time broker credit checks
• Route analysis with deadhead calculation

📄 VIRTUAL GLOVEBOX
• Scan Bills of Lading with your camera
• Store insurance, permits, IFTA records
• One-tap payday — snap BOL, auto-invoice, get paid

⛽ FUEL & TRUCK STOPS
• Live diesel prices from EIA government data
• Truck stops, parking, rest areas, weigh stations
• Turn-by-turn routing with truck restrictions

💰 EARNINGS INTELLIGENCE
• Real-time profit & loss tracking
• Cost-per-mile (CPM) monitoring
• Yearly revenue projection
• Expense logging with auto-categorization

📡 DISPATCHER RADIO
• Push-to-talk AI dispatcher
• Voice replies while you drive
• Real-time load updates and compliance alerts

🆓 FREE FOREVER TIER
The free tier includes ALL 10 AI workers — just bring your own free Anthropic API key (takes 2 minutes). No credit card required.

💎 PREMIUM TIERS
• Solo ($49/mo) — Unlimited documents, priority alerts
• Fleet ($149/mo) — Up to 5 trucks, multi-driver ready
• Enterprise ($399/mo) — Unlimited trucks, managed AI (no key needed), enterprise analytics

🔒 PRIVACY FIRST
Your data stays on your phone. AI requests use your own API key. Nothing is sold or shared.

Built by truckers, for truckers. Download PHI and let AI run your business.
```

### Keywords
```
trucking,truck loads,load board,freight,dispatch,owner operator,CDL,logistics,semi truck,DOT compliance,HOS,ELD,invoice,fuel prices,truck stops,earnings,profit,AI dispatch
```

### Screenshots Needed

| Platform | Sizes | Count |
|----------|-------|-------|
| iPhone | 6.5" (1290×2796), 5.5" (1242×2208) | 5 each |
| iPad | 12.9" (2048×2732) | 5 |
| Android | Phone (1080×1920), 7" tablet, 10" tablet | 5 each |

**Screenshot themes:**
1. Dashboard with revenue and AI workers
2. Load board with Diamond/Gold badges
3. AI Command Center with worker status
4. Virtual Glovebox document scanning
5. Earnings chart with profit projection

---

## 7. Post-Launch

### Monitoring

| Tool | Purpose | Check Frequency |
|------|---------|----------------|
| Sentry | Crash reports | Daily |
| RevenueCat | Subscription analytics | Daily |
| AdMob | Ad revenue | Weekly |
| Firebase Analytics | User engagement | Weekly |
| Google Play Console | Ratings, reviews, installs | Daily |
| App Store Connect | Ratings, reviews, installs | Daily |

### Update Strategy

| Type | Frequency | Trigger |
|------|-----------|---------|
| Bug fixes | As needed | Sentry crash reports |
| Feature updates | Monthly | User feedback + roadmap |
| Content updates | Weekly | New load data, fuel prices |
| Seasonal | Quarterly | Market condition changes |

### Review Response

- Respond to all reviews within 24 hours
- Thank positive reviews
- Address negative reviews with specific fixes
- Update app based on common feedback themes

---

## 8. Troubleshooting

### "Build fails with 'Unable to resolve module'"

```bash
cd mobile
rm -rf node_modules package-lock.json
npm install
npx expo prebuild --clean
```

### "Play Billing not working in production"

- Ensure app is installed via Play Store (not sideloaded)
- Check subscription products exist in Play Console
- Verify `phi_solo_monthly`, `phi_fleet_monthly`, `phi_enterprise_monthly` SKUs
- Test with license tester account first

### "RevenueCat not recognizing purchases"

- Verify API keys match platform (Android vs iOS)
- Check entitlements match product IDs in RevenueCat dashboard
- Ensure offerings are configured correctly
- Test with sandbox purchases first

### "App rejected for "minimum functionality""

- Ensure all buttons do something (no placeholders)
- Add more content/screens if needed
- Provide demo account credentials in App Review notes
- Include video of app functionality

### "Privacy policy rejected"

- Must mention: data collection, third-party services (Claude, RevenueCat, AdMob, Sentry)
- Must include: user rights, data deletion process, contact info
- Use generated policy from `docs/privacy-policy.md`

---

## 9. Release Checklist

### Before Submitting

- [ ] All tests pass (`npm run test`)
- [ ] TypeScript check passes (`npx tsc --noEmit`)
- [ ] No console.log statements in production code
- [ ] Environment variables set for production
- [ ] App icon and splash screen look correct
- [ ] All screens have content (no placeholder text)
- [ ] Deep linking works (`phi://` scheme)
- [ ] Push notifications work on device
- [ ] In-app purchases work in sandbox
- [ ] App doesn't crash on launch
- [ ] App works offline (test airplane mode)

### After Submitting

- [ ] Monitor crash reports (Sentry)
- [ ] Respond to App Review questions within 24 hours
- [ ] Prepare marketing materials (social media, email)
- [ ] Set up app landing page
- [ ] Configure support email auto-responder
- [ ] Plan first update (bug fixes + user feedback)

---

*Last updated: 2026-07-08*
