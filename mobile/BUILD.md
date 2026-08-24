# PHI Mobile App - Build & Deployment Guide

This guide covers building and deploying the Prince Haul Intelligence mobile app to the Google Play Store.

---

## 📱 Prerequisites

### Required Tools
- **Node.js** 20+ (LTS recommended)
- **npm** 10+
- **Expo CLI** (latest)
- **EAS CLI** (Expo Application Services)
- **Google Play Console** account
- **Java JDK** 17+ (for Android builds)
- **Android Studio** (optional, for emulator testing)

### Install Dependencies
```bash
# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Install project dependencies
cd mobile
npm install
```

---

## 🏗️ Local Development

### Start Development Server
```bash
# From the mobile directory
npm start

# Or from the project root
npm run mobile:start
```

### Run on Device
1. Install **Expo Go** app on your Android/iOS device
2. Scan the QR code from the terminal
3. Or press:
   - `a` - Run on Android emulator
   - `i` - Run on iOS simulator
   - `w` - Run in web browser

### Common Commands
```bash
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run in web browser
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
```

---

## 📦 Building for Production

### 1. Configure Environment Variables

Create `.env` file in the `mobile/` directory:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://api.phi-app.com
EXPO_PUBLIC_WS_URL=wss://api.phi-app.com

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true

# API Keys (if using mock services)
EXPO_PUBLIC_ANTHROPIC_API_KEY=
EXPO_PUBLIC_ORS_API_KEY=
EXPO_PUBLIC_EIA_API_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App Configuration
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENV=production
```

> **⚠️ IMPORTANT:** Never commit `.env` files to version control. They are in `.gitignore`.

### 2. Configure app.json

Update the following in `mobile/app.json`:

```json
{
  "expo": {
    "name": "Prince Haul Intelligence",
    "slug": "phi-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "scheme": "phi",
    "android": {
      "package": "com.princehaulintelligence.app",
      "versionCode": 1,
      "compileSdkVersion": 35,
      "targetSdkVersion": 35,
      "minSdkVersion": 24
    },
    "ios": {
      "bundleIdentifier": "com.princehaulintelligence.app"
    }
  }
}
```

### 3. Update Version Numbers

Before each release, update:
- `version` in `app.json` (e.g., "1.0.0" → "1.0.1")
- `versionCode` in `app.json` (Android: increment by 1)
- `buildNumber` in `app.json` (iOS: increment by 1)

```bash
# Use EAS to update version automatically
cd mobile
eas build --platform android --profile production
```

---

## 🚀 Building with EAS

### Install EAS CLI
```bash
npm install -g eas-cli
```

### Login to Expo
```bash
eas login
```

### Configure EAS Project
```bash
# From mobile directory
eas build:init
```

This creates `eas.json` with build profiles.

### Build Profiles

The `eas.json` file contains three profiles:

1. **development** - For local testing with development client
2. **preview** - For internal testing (APK for Android)
3. **production** - For Google Play Store (App Bundle)

### Build for Android

#### Development Build (APK)
```bash
cd mobile
eas build --platform android --profile development
```

#### Preview Build (APK)
```bash
eas build --platform android --profile preview
```

#### Production Build (App Bundle for Play Store)
```bash
eas build --platform android --profile production
```

### Build Options

| Option | Description |
|--------|-------------|
| `--platform android` | Build for Android |
| `--platform ios` | Build for iOS |
| `--profile development` | Use development profile |
| `--profile preview` | Use preview profile |
| `--profile production` | Use production profile |
| `--no-wait` | Don't wait for build to complete |
| `--auto-submit` | Auto-submit to Play Store after build |

---

## 📤 Submitting to Google Play Store

### Prerequisites

1. **Google Play Console** account
2. **Service Account** with Play Console access
3. **google-play-key.json** file (downloaded from Google Cloud Console)

### Step 1: Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use existing
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Create a new service account with **Play Android Developer** role
5. Generate a JSON key and save as `mobile/google-play-key.json`
6. Add service account email to Play Console users

### Step 2: Configure Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app: **Prince Haul Intelligence**
3. Fill in all required information:
   - App name
   - Category (Business or Productivity)
   - Contact details
   - Privacy policy URL
   - Content rating
4. Set up **App content rating questionnaire**
5. Set up **Target audience and content**

### Step 3: Upload First Build

#### Manual Upload
1. Build the app bundle:
   ```bash
   cd mobile
   eas build --platform android --profile production
   ```
2. Download the `.aab` file from EAS
3. Go to Play Console → Your App → **Production** track
4. Click **Create new release**
5. Upload the `.aab` file
6. Fill in release notes
7. Click **Review release**
8. Click **Rollout to production**

#### Automatic Upload with EAS

Update `eas.json`:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "production",
        "releaseStatus": "draft",
        "userFraction": 0.0,
        "rolloutFraction": 0.0
      }
    }
  }
}
```

Then submit:
```bash
cd mobile
eas submit --platform android --profile production
```

### Step 4: Submit for Review

1. In Play Console, navigate to **App content**
2. Complete all required sections:
   - **App content rating**
   - **Target audience**
   - **Privacy policy**
   - **Sensitive permissions**
3. Navigate to **Store presence**
4. Fill in:
   - Store listing (description, screenshots, icons)
   - Categorization
   - Contact details
   - Privacy policy
5. Navigate to **App releases**
6. Promote your release from **Draft** to **In review**
7. Click **Submit for review**

---

## 📋 Google Play Store Requirements

### Required Information

1. **App Name**: Prince Haul Intelligence
2. **Short Description** (80 chars): AI-powered trucking platform for owner-operators
3. **Full Description** (4000 chars):
   ```
   Prince Haul Intelligence (PHI) is the ultimate AI-powered companion for owner-operator truckers.
   
   FEATURES:
   • Autonomous load finding and booking
   • Real-time route optimization
   • Fuel cost calculation and optimization
   • Hours of Service (HOS) tracking
   • Digital document management (BOL, invoices)
   • Automatic invoice generation
   • Revenue tracking and analytics
   • Push notifications for important updates
   • Offline mode for areas without connectivity
   
   PHI's 15-agent AI system works 24/7 to:
   • Find the best paying loads
   • Negotiate rates on your behalf
   • Plan optimal routes with fuel stops
   • Monitor compliance and safety
   • Generate and submit invoices automatically
   
   Built for owner-operators by owner-operators. PHI helps you maximize revenue, minimize costs, and stay compliant.
   ```

### App Content Rating
- **Category**: Business
- **Content Rating**: Everyone (or Teen depending on features)
- **Violence**: No
- **Sexual Content**: No
- **Profanity**: No
- **Alcohol/Tobacco/Drugs**: No
- **Gambling**: No

### Target Audience
- **Age**: 18+ (truck drivers)
- **Region**: United States, Canada

### Permissions Justification

All permissions must be justified in the Play Console:

| Permission | Justification |
|------------|---------------|
| `ACCESS_FINE_LOCATION` | Required to calculate deadhead miles and find nearby loads |
| `ACCESS_COARSE_LOCATION` | Fallback for approximate location |
| `ACCESS_BACKGROUND_LOCATION` | Required to track route progress and HOS drive time in background |
| `CAMERA` | Required to scan bills of lading and freight documents |
| `READ_MEDIA_IMAGES` | Required to attach photos of freight documents |
| `INTERNET` | Required for API communication with PHI servers |
| `FOREGROUND_SERVICE` | Required for continuous route tracking |
| `RECEIVE_BOOT_COMPLETED` | Required to restart tracking service after device reboot |
| `VIBRATE` | Required for notification vibrations |

---

## 📊 App Store Assets

### Required Assets

Create the following assets in the `mobile/assets/` directory:

1. **App Icon** (`icon.png`)
   - Size: 1024×1024 pixels
   - Format: PNG
   - Background: Transparent or #0057FF (PHI Blue)

2. **Adaptive Icon** (`adaptive-icon.png`)
   - Size: 1024×1024 pixels
   - Format: PNG
   - Will be used for Android adaptive icons

3. **Splash Screen** (`splash.png`)
   - Size: 2048×2048 pixels (recommended)
   - Format: PNG
   - Background: #01092C (PHI Dark Blue)
   - Should display PHI logo and loading indicator

4. **Feature Graphic** (for Play Store)
   - Size: 1024×500 pixels
   - Format: PNG or JPEG
   - Highlights key features

5. **Screenshots** (for Play Store)
   - Phone: 1080×1920 pixels (6-8 screenshots)
   - Tablet: 1200×1920 pixels (optional)
   - Show key features:
     - Dashboard
     - Load search
     - Route planning
     - Document scanning
     - Invoices
     - Settings

### Color Scheme
- **Primary**: #0057FF (Royal Blue)
- **Secondary**: #FFD93D (Sunshine Yellow)
- **Background**: #01092C (Dark Blue)
- **Text**: #FFFFFF (White)
- **Success**: #00C853 (Money Green)
- **Error**: #FF5722 (Deep Orange)

---

## 🎯 Pre-Launch Checklist

### ✅ Backend
- [ ] Backend API deployed and running
- [ ] All endpoints tested
- [ ] Rate limiting configured
- [ ] CORS configured for mobile app
- [ ] Database connection pooling configured
- [ ] Job queue using Redis (not in-memory)
- [ ] Error handling and logging in place
- [ ] Security headers configured
- [ ] JWT authentication configured
- [ ] PHI_ADMIN_TOKEN set
- [ ] JWT_SECRET_KEY set

### ✅ Mobile App
- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] App icons created (1024×1024)
- [ ] Splash screen created
- [ ] All permissions justified
- [ ] Privacy policy URL configured
- [ ] Terms of service URL configured
- [ ] Contact information configured
- [ ] Version numbers updated
- [ ] Build successful (`eas build`)

### ✅ Google Play Console
- [ ] App created in Play Console
- [ ] Store listing completed
- [ ] App content rating questionnaire completed
- [ ] Target audience configured
- [ ] Privacy policy uploaded
- [ ] Screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] Service account configured
- [ ] google-play-key.json in place

### ✅ Testing
- [ ] App tested on multiple Android devices
- [ ] App tested on multiple Android versions (9+)
- [ ] Offline mode tested
- [ ] Push notifications tested
- [ ] Camera/document scanning tested
- [ ] Location services tested
- [ ] All workflows tested:
  - [ ] Load search and booking
  - [ ] Route planning
  - [ ] Document scanning
  - [ ] Invoice generation
  - [ ] Settings and profile

### ✅ Legal & Compliance
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Data collection disclosed
- [ ] Third-party services disclosed
- [ ] Permissions justified
- [ ] Content rating appropriate
- [ ] Age restrictions set (18+)

---

## 🚀 Post-Launch Checklist

### Immediately After Launch
- [ ] Monitor crash reports (Sentry/Firebase)
- [ ] Monitor API errors
- [ ] Monitor user feedback
- [ ] Monitor app store reviews
- [ ] Verify analytics are working

### First Week
- [ ] Monitor app performance
- [ ] Monitor user retention
- [ ] Respond to user feedback
- [ ] Fix critical bugs
- [ ] Plan next update

### First Month
- [ ] Analyze user behavior
- [ ] Identify most used features
- [ ] Identify least used features
- [ ] Plan feature improvements
- [ ] Plan marketing campaigns

---

## 📞 Support & Resources

### Expo Documentation
- [Expo Docs](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/eas/)
- [EAS Submit](https://docs.expo.dev/distribution/eas-submit/)

### Google Play Resources
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Play Console API](https://developers.google.com/android-publisher)
- [App Content Rating](https://support.google.com/googleplay/android-developer/answer/9888477)

### PHI Specific
- [PHI Architecture](https://github.com/michellemcbean5-droid/phi-app/docs/architecture.md)
- [PHI API Documentation](https://github.com/michellemcbean5-droid/phi-app/docs/api.md)
- [PHI Backend Setup](https://github.com/michellemcbean5-droid/phi-app/backend/README.md)

---

## 🔄 Update Process

### Version Bump
```bash
# Update version in app.json
cd mobile

# Manual version bump
# Update version, versionCode (Android), buildNumber (iOS)

# Or use EAS to auto-increment
eas build --platform android --profile production --auto-increment
```

### Release Notes
Maintain a `CHANGELOG.md` file:

```markdown
# Changelog

## [1.0.0] - 2024-01-01
### Added
- Initial release of Prince Haul Intelligence mobile app
- Load search and booking
- Route optimization
- Document scanning
- Invoice generation

## [1.0.1] - 2024-01-15
### Fixed
- Bug fixes for Android 12+ compatibility
- Improved camera scanning
- Performance improvements
```

### Submit Update
```bash
# Build and submit
cd mobile
eas build --platform android --profile production
eas submit --platform android --profile production
```

---

## ⚠️ Common Issues & Solutions

### Issue: Build fails with "Failed to install dependencies"
**Solution:**
```bash
cd mobile
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue: "Keystore file not found"
**Solution:**
```bash
# Generate a new keystore
eas credentials:create --platform android

# Or use existing keystore
eas credentials:import --platform android --path /path/to/keystore.jks
```

### Issue: "Upload failed: You cannot rollout this release"
**Solution:**
- Check that versionCode is higher than previous release
- Check that version is different from previous release
- Wait for previous release to fully roll out

### Issue: "App rejected for policy violation"
**Solution:**
- Check email from Google Play for specific violation
- Update app content rating if needed
- Update privacy policy if needed
- Justify permissions in Play Console
- Resubmit with changes

### Issue: "Build takes too long"
**Solution:**
- Use EAS cache: `eas cache:configure`
- Build only changed platforms
- Use `--no-wait` flag and check status later
- Check EAS build logs for bottlenecks

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | TBD | Initial release |

---

**Last Updated:** January 2025
**Maintainer:** Q-Empire AI Automation
**Contact:** tech@q-empire.io
