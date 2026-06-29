# PHI Mobile App

Prince Haul Intelligence (PHI) Mobile App - AI-Powered Trucking Platform

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or later
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on your device:**
   - **Android:** Scan the QR code with Expo Go app
   - **iOS:** Scan the QR code with Expo Go app
   - **Web:** Press `w` to open in browser

## 📱 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo development server |
| `npm run android` | Start on Android device/emulator |
| `npm run ios` | Start on iOS simulator |
| `npm run web` | Start web version |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run typecheck` | TypeScript type checking |
| `npm run clean` | Clean node_modules and reinstall |

## 🏗️ Project Structure

```
mobile/
├── App.tsx                    # Main app component
├── src/
│   ├── api/                   # API connectors (DAT, Google Maps, etc.)
│   ├── assets/                # Static assets and brand colors
│   ├── components/            # Reusable UI components
│   ├── middleware/            # Middleware (auth, etc.)
│   ├── navigation/            # Navigation configuration
│   ├── screens/               # App screens
│   ├── store/                 # Zustand stores
│   ├── utils/                 # Utility functions
│   ├── workers/               # AI worker logic
│   └── __tests__/             # Unit tests
├── app.json                   # Expo configuration
├── eas.json                   # EAS build configuration
└── package.json               # Dependencies and scripts
```

## 🎯 Core Features

### AI Workers (15x)
- **LoadFinderWorker** - Finds available loads
- **NegotiationStrategyWorker** - Optimizes negotiation strategies
- **RouteAnalysisWorker** - Analyzes optimal routes
- **FuelOptimizerWorker** - Optimizes fuel consumption
- **ComplianceAuditWorker** - Ensures compliance with regulations
- **AutoBookingEngine** - Automates load booking
- **LoadScoringWorker** - Scores and ranks loads
- **ProfitAnalystWorker** - Analyzes profitability
- **DriverAvailabilityWorker** - Manages driver availability
- **MarketAnalysisWorker** - Analyzes market trends
- **DocumentProcessingWorker** - Processes documents
- **SocialSchedulerWorker** - Manages social media scheduling
- **CustomerSupportWorker** - Handles customer support
- **AnalyticsWorker** - Tracks analytics
- **NotificationWorker** - Manages notifications

### Screens
- **Dashboard** - Main dashboard with KPIs
- **Loads** - Load board and management
- **AI Command Center** - AI worker monitoring
- **Earnings** - Revenue and profit tracking
- **Profile** - User profile and settings
- **Compliance** - Compliance monitoring
- **Documents** - Document management
- **Notifications** - Notification center
- **Settings** - App settings
- **Vehicle** - Vehicle management
- **Subscription** - Subscription management

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the mobile directory:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
EXPO_PUBLIC_DAT_API_KEY=your_dat_api_key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your_twilio_sid
EXPO_PUBLIC_TWILIO_AUTH_TOKEN=your_twilio_token
```

### App Configuration
Edit `app.json` for app metadata:
- App name, version, and icons
- Android package name
- iOS bundle identifier
- Splash screen configuration

### EAS Configuration
Edit `eas.json` for build profiles:
- Development builds
- Preview builds
- Production builds
- Google Play submission

## 🚀 Deployment

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Log in to Expo
```bash
eas login
```

### 3. Configure Google Play
- Create a service account in Google Play Console
- Download the JSON key and save as `google-play-key.json`
- Update `eas.json` with your package name

### 4. Build and Submit

**Preview Build:**
```bash
npm run build:preview
```

**Production Build:**
```bash
npm run build:production
```

**Submit to Google Play:**
```bash
npm run submit
```

## 🧪 Testing

### Unit Testing
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## 📊 Code Quality

### ESLint
- TypeScript-specific rules
- React/React Native best practices
- No `any` types allowed
- No console statements in production

### Prettier
- Consistent code formatting
- 2-space indentation
- Single quotes
- Semicolons

### Husky
- Pre-commit hooks for:
  - ESLint
  - Prettier
  - Type checking

## 🔒 Security

### Secure Storage
- Auth tokens stored in `expo-secure-store`
- Sensitive data encrypted
- No hardcoded API keys

### Validation
- Input validation with Zod
- Type safety throughout
- Error boundaries for UI

## 📈 Performance

### Optimizations
- React.memo for component memoization
- useCallback for function memoization
- FlatList for large lists
- Image optimization
- Offline support with AsyncStorage

### Monitoring
- Performance monitoring with react-native-performance
- Error tracking (Sentry integration recommended)
- Analytics (Mixpanel/Amplitude recommended)

## 🎨 Brand Guidelines

### Colors
```typescript
// Primary colors
PHI_COLORS.royalBlue    // #0057FF
PHI_COLORS.sunshineYellow // #FFD93D
PHI_COLORS.charcoalBlack // #1A1A1A
PHI_COLORS.moneyGreen   // #00C853

// Background colors
PHI_COLORS.background    // #0f3460
PHI_COLORS.surface      // #ffffff
PHI_COLORS.surfaceDark  // #16213e

// Text colors
PHI_COLORS.textPrimary  // #ffffff
PHI_COLORS.textSecondary // #D7E3FF
PHI_COLORS.textTertiary // #aaa

// Status colors
PHI_COLORS.success      // #00C853
PHI_COLORS.warning      // #FFD93D
PHI_COLORS.error        // #e94560
PHI_COLORS.info         // #0057FF
```

### Typography
- **Headings:** Bold, 24-32px
- **Body:** Regular, 16px
- **Small Text:** Regular, 14px
- **Buttons:** Bold, 16px

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Commit Message Format
```
type(scope): description

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Pull Request Checklist
- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Code is formatted with Prettier
- [ ] No `any` types used
- [ ] No console statements
- [ ] Documentation updated

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - React Native framework
- [React Navigation](https://reactnavigation.org/) - Navigation library
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Zod](https://github.com/colinhacks/zod) - Type-safe validation
- [Vitest](https://vitest.dev/) - Testing framework
- [ESLint](https://eslint.org/) - Linting
- [Prettier](https://prettier.io/) - Code formatting

## 📞 Support

For support, questions, or feedback:
- **Email:** support@princehaulintelligence.com
- **Website:** https://princehaulintelligence.com
- **Documentation:** https://docs.princehaulintelligence.com
