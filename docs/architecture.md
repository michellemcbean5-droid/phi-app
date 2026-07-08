# PHI Architecture

> System design and architecture documentation for Prince Haul Intelligence.

---

## 1. System Overview

PHI is a fullstack application with three layers:

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
│  React Native + TypeScript + Zustand + React Navigation  │
│  iOS / Android / Web (via react-native-web)              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼ API / WebSocket
┌─────────────────────────────────────────────────────────┐
│                  Backend API (FastAPI)                   │
│  Python 3.11 + FastAPI + CrewAI + SQLAlchemy + Pydantic  │
│  PostgreSQL (prod) / SQLite (dev)                      │
│  WebSocket for real-time dispatcher radio                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼ Static Site / SSR
┌─────────────────────────────────────────────────────────┐
│                  Web Frontend (Next.js)                  │
│  Next.js 15 + React + TypeScript + Tailwind CSS        │
│  App Router (app/) + Server Components                 │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Mobile Architecture

### 2.1 Navigation Structure

```
Root Stack Navigator
├── LoadingScreen (splash + progress bar)
├── WelcomeScreen (login / get started)
├── Main (Tab Navigator)
│   ├── DashboardTab
│   ├── LoadsTab
│   ├── AITab (AI Command Center)
│   ├── EarningsTab
│   └── ProfileTab
├── LoadDetailsScreen (modal push)
├── AICommandCenterScreen
├── ComplianceScreen
├── DocumentsScreen
├── NotificationsScreen
├── SettingsScreen
├── VehicleScreen
├── SubscriptionScreen
├── PromoCodeScreen
├── APIKeysScreen
├── DriverPrefsScreen
├── DispatcherRadioScreen
├── InboxScreen
├── MessageThreadScreen
├── EquipmentMarketplaceScreen
├── SupportChatScreen
└── TruckStopFinderScreen
```

### 2.2 State Management (Zustand Stores)

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `authStore` | JWT token, user role, login/logout | ❌ (memory only) |
| `workerStore` | 10 AI workers, activity log, revenue | ✅ AsyncStorage |
| `loadsStore` | Active loads, booking history, filters | ✅ AsyncStorage (partial) |
| `expenseStore` | Expense entries, category totals | ✅ AsyncStorage |
| `promoStore` | Active tier, trial dates, redeemed codes | ✅ AsyncStorage |
| `vehicleStore` | Vehicle profiles, GPS status | ✅ AsyncStorage |
| `documentsStore` | Scanned documents, file system | ✅ FileSystem + JSON index |
| `apiKeyStore` | Customer API keys | ✅ SecureStore (encrypted) |
| `inboxStore` | Message threads | ❌ (memory only) |
| `radioStore` | Dispatcher radio messages | ❌ (memory only) |
| `supportChatStore` | Michelle support chat | ❌ (memory only) |
| `affiliateStore` | Referral affiliate ID | ✅ AsyncStorage |
| `driverPrefsStore` | AI dispatcher preferences | ❌ (memory only, defaults) |

### 2.3 AI Worker Architecture

```
WorkerOrchestrator
├── DispatchCoordinatorWorker
├── FreightNegotiatorWorker
├── RouteOptimizerWorker
├── ComplianceSafetyWorker
├── InvoiceSpecialistWorker
├── FuelOptimizerWorker
├── LoadScoringWorker (Fleet Maintenance)
├── ProfitAnalystWorker (Track & Trace)
├── DocumentManagerWorker (Driver Liaison)
└── NotificationWorker (Business Intelligence)

Each worker has:
- id, name, role, description
- aiPoweredBy (which APIs it uses)
- status: 'active' | 'idle' | 'error'
- tasksToday, revenueImpact
- lastHeartbeat (timestamp)
```

### 2.4 API Layer Architecture

```
┌────────────────────────────────────────┐
│           Screen Components           │
│  Dashboard, Loads, Earnings, etc.     │
└────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│           Zustand Stores              │
│  State + Actions + Persistence         │
└────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│           Worker Logic                │
│  Business logic, calculations, AI    │
│  prompts, data transformation          │
└────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│           API Connectors              │
│  HTTP clients with fallback logic      │
│  claudeClient, googleMapsConnector,    │
│  truckStopFinder, twilioConnector,   │
│  samsaraConnector, datConnector        │
└────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│           External APIs               │
│  Claude, ORS, EIA, OSM, Expo Push,   │
│  Play Billing, RevenueCat, AdMob     │
└────────────────────────────────────────┘
```

### 2.5 Offline Support Strategy

| Feature | Offline Strategy |
|---------|-----------------|
| Load board | Static fallback loads + cached last AI response |
| Route analysis | Haversine formula (no API needed) |
| Fuel prices | Cached national average ($3.82) |
| Truck stops | Empty list with retry button |
| Documents | Full offline (local FileSystem) |
| Expenses | Full offline (AsyncStorage) |
| Earnings | Full offline (AsyncStorage) |
| AI chat | FAQ fallback (no API needed) |
| Radio | Canned responses (no API needed) |
| Compliance | Local HOS calculation from session timestamp |

---

## 3. Backend Architecture

### 3.1 FastAPI Application Structure

```
backend/
├── main.py              # FastAPI app, routers, middleware
├── agents.py            # 15 CrewAI agent definitions
├── tasks.py             # Task builders and workflows
├── app/
│   ├── database.py      # SQLAlchemy ORM, connection
│   ├── models.py        # Pydantic + SQLAlchemy models
│   ├── agent_events.py  # Agent event streaming
│   └── websocket_manager.py  # WebSocket connection manager
├── services/
│   ├── communication.py  # Twilio, SendGrid, Firebase
│   └── push.py           # Push notification service
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── deploy.sh
```

### 3.2 Database Schema (Simplified)

```sql
-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text default 'Driver',
  created_at timestamptz default now()
);

-- Loads
create table loads (
  id text primary key,
  source text,
  equipment_type text,
  broker_name text,
  broker_rating decimal,
  origin_city text,
  origin_state text,
  destination_city text,
  destination_state text,
  rate decimal,
  miles integer,
  rpm decimal,
  status text default 'available',
  created_at timestamptz default now()
);

-- Bookings
create table bookings (
  id uuid primary key default gen_random_uuid(),
  load_id text references loads(id),
  user_id uuid references users(id),
  confirmation_id text,
  booked_at timestamptz default now(),
  status text default 'confirmed'
);

-- Expenses
create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  category text,
  amount decimal,
  description text,
  date timestamptz default now()
);

-- Vehicles
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  year text,
  make text,
  model text,
  plate text,
  vin text,
  gps_enabled boolean default true
);
```

### 3.3 CrewAI Agent System

```
AgentOrchestrator
├── MarketAnalystAgent      # Analyzes freight market trends
├── LoadFinderAgent         # Discovers available loads
├── RateNegotiatorAgent     # Negotiates with brokers
├── RoutePlannerAgent       # Plans optimal routes
├── ComplianceOfficerAgent  # Monitors HOS/DOT compliance
├── InvoiceManagerAgent     # Generates and submits invoices
├── FuelOptimizerAgent      # Finds cheapest fuel stops
├── MaintenanceTrackerAgent # Schedules preventive maintenance
├── CustomerServiceAgent    # Updates shippers/receivers
└── BusinessAnalystAgent    # Calculates P&L, CPM, trends
```

---

## 4. Web Frontend Architecture

### 4.1 Next.js App Router Structure

```
app/
├── layout.tsx           # Root layout with providers
├── page.tsx             # Landing page (marketing)
├── globals.css          # Tailwind + custom styles
├── components/
│   ├── EmailForm.tsx    # Lead capture form
│   └── ...
└── (future routes)
    ├── dashboard/
    ├── loads/
    └── api/
```

### 4.2 Data Flow

```
User → Next.js Page → React Components → API Client → FastAPI Backend
                                              ↓
                                         Zustand Store (client-side state)
                                              ↓
                                         LocalStorage / Cookies
```

---

## 5. Security Architecture

### 5.1 Data Protection

| Layer | Protection |
|-------|-----------|
| API Keys | SecureStore (encrypted, iOS Keychain / Android Keystore) |
| JWT Tokens | Memory-only (authStore), not persisted |
| Documents | Local FileSystem, no cloud upload |
| Analytics | PII sanitized before sending to Sentry |
| Push Tokens | Expo handles securely |
| Payments | Play Billing / RevenueCat (PCI-compliant) |

### 5.2 Authentication Flow

```
1. User taps "Get Started" or "Log In"
2. createDemoToken() generates local JWT (no server call)
3. Token stored in authStore (memory only)
4. hasRole() checks role hierarchy: Driver < Admin < CEO
5. Logout clears token from memory

Future: OAuth2 / Firebase Auth integration
```

### 5.3 Subscription Validation

```
1. App launch: initRevenueCat() or initBilling()
2. Check active entitlements / purchases
3. Map to internal UserTier: Free | Solo | Fleet | Enterprise
4. Gate features based on tier
5. Promo codes override via promoStore (client-side validation)
6. Master Access Code (env var) unlocks Elite for owner testing
```

---

## 6. Deployment Architecture

### 6.1 CI/CD Pipeline

```
GitHub Push to main
    │
    ├──► GitHub Actions CI
    │    ├── Run ESLint
    │    ├── Run TypeScript check
    │    ├── Run mobile tests (Vitest)
    │    └── Run backend tests (pytest)
    │
    ├──► Vercel (auto-deploy web)
    │
    ├──► Render (auto-deploy backend)
    │
    └──► EAS Build (manual trigger or nightly)
         ├── Android APK (preview)
         ├── Android AAB (production)
         └── iOS (production)
```

### 6.2 Environment Strategy

| Environment | Web | Backend | Mobile |
|------------|-----|---------|--------|
| Development | localhost:3000 | localhost:8000 | Expo Go / simulator |
| Staging | staging.phi.app | staging-api.phi.app | Internal TestFlight / Play Internal |
| Production | princehaulintelligence.com | api.princehaulintelligence.com | App Store / Play Store |

---

## 7. Performance Considerations

### 7.1 Mobile Optimizations

- **Image assets:** Compressed PNGs, adaptive icons
- **Bundle size:** Tree-shaking, no unused dependencies
- **Startup time:** LoadingScreen with progress bar, lazy screen loading
- **Animations:** useNativeDriver for all Animated APIs
- **Reanimated:** Worklet-based animations for coin burst, efficiency dial
- **State hydration:** Zustand persist middleware with AsyncStorage
- **API caching:** In-memory caches for diesel price, load data

### 7.2 Backend Optimizations

- **Async endpoints:** All I/O-bound operations use async/await
- **Connection pooling:** SQLAlchemy engine with pool_size=10
- **Rate limiting:** WorkerOrchestrator.rateLimiter() per worker
- **Caching:** Redis (future) for load data and market summaries
- **CDN:** Cloudflare for static assets

---

## 8. Scalability Plan

### Current (MVP)
- Single FastAPI instance
- SQLite or single PostgreSQL instance
- Expo push notifications
- Static loads + AI-generated loads

### Phase 2 (100+ users)
- PostgreSQL with read replicas
- Redis for caching and session storage
- Celery for background task processing
- Load balancer with multiple FastAPI workers

### Phase 3 (1000+ users)
- Kubernetes deployment
- Dedicated AI inference cluster (Claude proxy)
- CDN for document storage (S3 / Cloudflare R2)
- Real-time WebSocket cluster

---

*Last updated: 2026-07-08*
