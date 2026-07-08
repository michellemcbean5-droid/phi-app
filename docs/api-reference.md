# PHI API Reference

> Complete reference for all APIs integrated into the Prince Haul Intelligence mobile app.
> All APIs listed have **free tiers** — zero cost to the user when configured.

---

## Table of Contents

- [AI APIs](#ai-apis)
- [Routing APIs](#routing-apis)
- [Fuel Price APIs](#fuel-price-apis)
- [Mapping & Location APIs](#mapping--location-apis)
- [Truck Stop Data APIs](#truck-stop-data-apis)
- [Notification APIs](#notification-apis)
- [Payment & Billing APIs](#payment--billing-apis)
- [Analytics & Crash APIs](#analytics--crash-apis)
- [Backend API](#backend-api)
- [Environment Variables](#environment-variables)

---

## AI APIs

### Anthropic Claude (Messages API)

**Provider:** Anthropic  
**Endpoint:** `https://api.anthropic.com/v1/messages`  
**Free Tier:** $5 credit on signup at [console.anthropic.com](https://console.anthropic.com)  
**Rate Limits:** Depends on tier; generous for Haiku model  
**Model Used:** `claude-haiku-4-5-20251001` (configurable)

**Features powered by Claude:**
- Load generation (realistic freight loads based on market conditions)
- Broker negotiation email drafting
- Compliance risk analysis and DOT recommendations
- Support chat responses (Michelle assistant)
- Dispatcher radio replies
- Fuel stop optimization recommendations
- Toll cost estimation

**Implementation:** `mobile/src/api/claudeClient.ts`

```typescript
import { askClaude, askClaudeJSON, isClaudeConfigured } from './api/claudeClient';

// Simple text completion
const reply = await askClaude('Find me a load from Dallas to Atlanta', undefined, 512);

// JSON-structured response
const loads = await askClaudeJSON<Load[]>('Generate 3 dry van loads...', SYSTEM_PROMPT, 1024);
```

**Fallback:** When Claude is not configured, all AI features use rule-based logic and static data. The app never breaks — it just gets smarter with Claude.

---

### PHI Managed AI Proxy (Self-Hosted)

**Provider:** Self-hosted (backend/managed-ai-proxy/)  
**Endpoint:** Configurable via `EXPO_PUBLIC_MANAGED_AI_PROXY_URL`  
**Authentication:** Shared secret via `x-phi-shared-secret` header  
**Cost:** Free (runs on owner's backend infrastructure)

**Use Case:** For Enterprise tier users who don't want to set up their own API key. The proxy handles Claude API calls server-side.

**Implementation:** `mobile/src/api/claudeClient.ts` → `askViaManagedProxy()`

---

## Routing APIs

### OpenRouteService (ORS)

**Provider:** HeiGIT / University of Heidelberg  
**Endpoint:** `https://api.openrouteservice.org/v2`  
**Free Tier:** 2,000 requests/day  
**Signup:** [openrouteservice.org/dev](https://openrouteservice.org/dev)  
**Docs:** [openrouteservice.org/documentation](https://openrouteservice.org/documentation)

**Features:**
- Truck-specific routing (HGV profile)
- Distance matrix calculations
- Multi-stop route optimization
- Deadhead mileage calculation

**Implementation:** `mobile/src/api/googleMapsConnector.ts`

```typescript
import { fetchDistanceMatrix, calculateMultiStopRoute } from './api/googleMapsConnector';

const result = await fetchDistanceMatrix(origin, destination);
// Returns: { distanceMiles: number, durationMinutes: number, source: 'openrouteservice' | 'haversine' }
```

**Fallback:** Haversine formula (great-circle distance × 1.12 for road estimation) when ORS key is not set or API fails.

---

## Fuel Price APIs

### EIA Open Data API (US Energy Information Administration)

**Provider:** US Government (eia.gov)  
**Endpoint:** `https://api.eia.gov/v2/petroleum/pri/gnd/data/`  
**Free Tier:** Unlimited (requires free API key registration)  
**Signup:** [eia.gov/opendata/register.php](https://eia.gov/opendata/register.php)  
**Docs:** [eia.gov/opendata](https://eia.gov/opendata)

**Features:**
- Weekly national diesel price average
- Historical fuel price trends
- Regional price breakdowns

**Implementation:** `mobile/src/utils/fuelOptimizer.ts`

```typescript
import { fetchLiveDieselPrice } from './utils/fuelOptimizer';

const price = await fetchLiveDieselPrice();
// Returns: { nationalAverage: number, period: string, source: 'eia' | 'cached' }
```

**Fallback:** Cached national average of $3.82/gal when API is unavailable.

---

## Mapping & Location APIs

### Expo Location (Native)

**Provider:** Expo / Device GPS  
**Cost:** Free (no API key required)  
**Permissions:** Location permissions required

**Features:**
- Real-time GPS coordinates
- Reverse geocoding (city/state from coordinates)
- Background location tracking (with permissions)

**Implementation:** `mobile/src/api/samsaraConnector.ts`

```typescript
import { getCurrentDriverLocation } from './api/samsaraConnector';

const location = await getCurrentDriverLocation();
// Returns: { latitude: number, longitude: number } | null
```

---

## Truck Stop Data APIs

### OpenStreetMap Overpass API

**Provider:** OpenStreetMap Contributors  
**Endpoint:** `https://overpass-api.de/api/interpreter`  
**Cost:** Free (no API key required)  
**Rate Limits:** Fair use (please don't hammer)

**Features:**
- Truck stops and fuel stations
- Truck parking areas
- Rest areas and weigh stations
- Real-time query by GPS radius

**Implementation:** `mobile/src/api/truckStopFinder.ts`

```typescript
import { findNearbyTruckStops } from './api/truckStopFinder';

const stops = await findNearbyTruckStops(location, 30); // 30-mile radius
// Returns: TruckStopPOI[] with name, kind, distance, coordinates
```

**Data freshness:** Real-time OSM data. No caching — always current.

---

## Notification APIs

### Expo Push Notifications

**Provider:** Expo  
**Cost:** Free for standard push notifications  
**Setup:** No FCM/APNs configuration required for development

**Features:**
- Local scheduled notifications
- Remote push notifications (via Expo Push Service)
- Custom icons, colors, and sounds
- Notification categories and actions

**Implementation:** `mobile/src/api/twilioConnector.ts` (replaces Twilio with free Expo notifications)

```typescript
import { sendLoadBookedSMS, sendComplianceAlert } from './api/twilioConnector';

// Actually sends Expo push notification, not SMS
await sendLoadBookedSMS('+15550100111', { loadId: 'DAT-101', origin: 'Dallas', destination: 'Atlanta', rate: 2925 });
```

**Fallback:** In-app messaging via RadioStore and InboxStore when push permissions are denied.

---

## Payment & Billing APIs

### Google Play Billing (react-native-iap)

**Provider:** Google Play Store  
**Cost:** 15% fee to Google (reduced from 30% for first $1M)  
**Products:** `phi_solo_monthly`, `phi_fleet_monthly`, `phi_enterprise_monthly`

**Features:**
- In-app subscription purchases
- Subscription restoration
- Purchase acknowledgment
- Real-time price fetching from Play Console

**Implementation:** `mobile/src/api/googlePlayBilling.ts`

---

### RevenueCat Purchases

**Provider:** RevenueCat  
**Cost:** Free up to $10K MRR, then 1% of revenue  
**Signup:** [revenuecat.com](https://revenuecat.com)

**Features:**
- Cross-platform subscription management (iOS + Android)
- Entitlement tracking
- Subscription analytics
- A/B testing for paywalls

**Implementation:** `mobile/src/api/revenueCatBilling.ts`

---

### AdMob (Google Mobile Ads)

**Provider:** Google AdMob  
**Cost:** Free to integrate (revenue share with Google)  
**Signup:** [admob.google.com](https://admob.google.com)

**Features:**
- Banner ads (free tier)
- Interstitial ads (between screens)
- Rewarded ads (unlock premium features temporarily)
- Test IDs in development

**Implementation:** `mobile/src/api/adMob.ts`

---

## Analytics & Crash APIs

### Sentry

**Provider:** Sentry  
**Cost:** Free tier: 5K errors/month, 10M performance units  
**Signup:** [sentry.io](https://sentry.io)

**Features:**
- Crash reporting with stack traces
- Performance monitoring (traces)
- User feedback collection
- Breadcrumbs for debugging context
- PII sanitization (emails/phones removed before sending)

**Implementation:** `mobile/src/config/sentry.ts`

---

### Firebase Analytics

**Provider:** Google Firebase  
**Cost:** Free tier: unlimited events, up to 500 distinct event types  
**Signup:** [firebase.google.com](https://firebase.google.com)

**Features:**
- Screen view tracking
- Custom event logging
- User property segmentation
- Purchase event tracking

**Implementation:** `mobile/src/config/analytics.ts`

---

## Backend API

### PHI FastAPI Backend

**Base URL:** `https://api.princehaulintelligence.com/v1` (production)  
**Local:** `http://localhost:8000`

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service identity and version |
| GET | `/health` | Health check |
| GET | `/api/v1/agents` | List all 15 CrewAI agents |
| POST | `/api/v1/loads/search` | Search loads with filters |
| POST | `/api/v1/loads/book` | Book a load |
| GET | `/api/v1/compliance/hos/{driver_id}` | HOS status |
| POST | `/api/v1/compliance/audit` | Run compliance audit |
| GET | `/api/v1/earnings/summary` | Earnings summary |
| POST | `/api/v1/ai/proxy` | Managed AI proxy (Enterprise) |
| WebSocket | `/ws/dispatch` | Real-time dispatcher radio |

**Authentication:** JWT Bearer token (see `mobile/src/middleware/authMiddleware.ts`)

**Implementation:** `backend/main.py`

---

## Environment Variables

Copy `mobile/.env.example` to `mobile/.env` and fill in:

```env
# AI
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-api03-...

# Routing
EXPO_PUBLIC_ORS_API_KEY=eyJ0eXAiOiJKV1...

# Fuel
EXPO_PUBLIC_EIA_API_KEY=abc123def...

# Billing (RevenueCat)
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_...
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_...

# Ads (AdMob)
EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx
EXPO_PUBLIC_ADMOB_APP_ID_IOS=ca-app-pub-xxxxxxxxxxxxxxxx~xxxxxxxxxx

# Analytics
EXPO_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxxxx.ingest.sentry.io/xxxxxxx
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Backend
EXPO_PUBLIC_API_BASE_URL=https://api.princehaulintelligence.com/v1
EXPO_PUBLIC_WS_URL=wss://api.princehaulintelligence.com/ws

# Managed AI Proxy (Enterprise)
EXPO_PUBLIC_MANAGED_AI_PROXY_URL=https://your-proxy.com/ai
EXPO_PUBLIC_MANAGED_AI_SHARED_SECRET=your-secret-here
```

> **Security:** Never commit `.env` to git. It is already in `.gitignore`.

---

## API Summary Table

| API | Free Tier | Key Required | Fallback | File |
|-----|-----------|-------------|----------|------|
| Anthropic Claude | $5 credit | Yes | Rule-based logic | `api/claudeClient.ts` |
| OpenRouteService | 2,000 req/day | Yes | Haversine formula | `api/googleMapsConnector.ts` |
| EIA Open Data | Unlimited | Yes | Cached $3.82 | `utils/fuelOptimizer.ts` |
| Expo Location | Unlimited | No | N/A | `api/samsaraConnector.ts` |
| OSM Overpass | Fair use | No | Empty list | `api/truckStopFinder.ts` |
| Expo Push | Unlimited | No | In-app messages | `api/twilioConnector.ts` |
| Google Play Billing | N/A | No | Promo codes | `api/googlePlayBilling.ts` |
| RevenueCat | $10K MRR | Yes | Play Billing | `api/revenueCatBilling.ts` |
| AdMob | N/A | Yes | No ads shown | `api/adMob.ts` |
| Sentry | 5K errors/mo | Yes | Console logging | `config/sentry.ts` |
| Firebase | 500 events | Yes | No analytics | `config/analytics.ts` |

---

## Adding a New API

1. Create a new file in `mobile/src/api/` (e.g., `newService.ts`)
2. Export async functions with explicit return types
3. Add a free-tier fallback for when the API is unavailable
4. Add the API key to `mobile/.env.example` with `EXPO_PUBLIC_` prefix
5. Document in this file
6. Add tests in `mobile/src/__tests__/` with mocked API responses
7. Update `mobile/src/screens/APIKeysScreen.tsx` if user needs to enter a key

---

*Last updated: 2026-07-08*
