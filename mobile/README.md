# PHI App – Mobile (Expo React Native)

**Prince Haul Intelligence** – AI Trucking App

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS/Android) for testing

### Install & Run

```bash
cd mobile
npm install
npm run start
```

Scan the QR code with **Expo Go** to launch on your device.

## Project Structure

```
mobile/
├── App.tsx                        # Root component
├── app.json                       # Expo config
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── babel.config.js                # Babel config
├── assets/                        # App icons & splash screen
└── src/
    ├── navigation/
    │   ├── RootNavigator.tsx      # Stack navigator
    │   └── TabNavigator.tsx       # Bottom tab navigator
    └── screens/
        ├── DashboardScreen.tsx    # Home dashboard
        ├── LoadsScreen.tsx        # Load listings
        ├── LoadDetailsScreen.tsx  # Load detail view
        ├── EarningsScreen.tsx     # Earnings & charts
        └── ProfileScreen.tsx     # Driver profile
```

## Screens

| Screen | Description |
|---|---|
| **Dashboard** | Overview stats, quick actions |
| **Loads** | Active/pending/delivered loads |
| **Load Details** | Full load info (push from Loads) |
| **Earnings** | Weekly bar chart + monthly summary |
| **Profile** | Driver info, CDL, settings menu |

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| Background | `#0f3460` | Main bg |
| Surface | `#16213e` | Cards |
| Dark Navy | `#1a1a2e` | Header/Tab bar |
| Accent Red | `#e94560` | CTA, active states |
| Green | `#4caf50` | Earnings, delivered |
