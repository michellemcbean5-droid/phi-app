# Load Board Integrations

PHI aggregates loads from **4 sources** simultaneously:

| Board | Connector | Credentials Needed | Fallback |
|-------|-----------|-------------------|---------|
| DAT | Built-in (AI-powered) | `EXPO_PUBLIC_ANTHROPIC_API_KEY` | Static curated loads |
| Truckstop.com | `truckstopConnector.ts` | `EXPO_PUBLIC_TRUCKSTOP_API_KEY` | AI → static |
| Amazon Relay | `amazonRelayConnector.ts` | `EXPO_PUBLIC_AMAZON_RELAY_CLIENT_ID` + `SECRET` | AI → static |
| Coyote Logistics | `coyoteConnector.ts` | `EXPO_PUBLIC_COYOTE_API_KEY` | AI → static |

## How It Works

1. All 4 connectors are fetched in **parallel** via `Promise.allSettled`.
2. Results are **deduplicated** by corridor + rate + equipment type.
3. A **quality filter** removes loads with `brokerRating < 4.0`, `rpm ≤ 0`, or missing data.
4. Top loads trigger **AI outreach email generation** (fire-and-forget).
5. **Connector health** is tracked in `connectorHealth.ts` — view in Settings → Load Board Status.

## Adding Live Credentials

Add to `mobile/.env` (never commit):
```
EXPO_PUBLIC_TRUCKSTOP_API_KEY=your_key
EXPO_PUBLIC_AMAZON_RELAY_CLIENT_ID=your_client_id
EXPO_PUBLIC_AMAZON_RELAY_CLIENT_SECRET=your_secret
EXPO_PUBLIC_COYOTE_API_KEY=your_key
```

Also add to EAS secrets for production builds:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_TRUCKSTOP_API_KEY --value your_key
```

## AI Fallback

When live credentials are not set but `EXPO_PUBLIC_ANTHROPIC_API_KEY` is configured,
Claude AI generates market-accurate loads reflecting current US spot rates.
When neither is set, curated static loads are returned for development.

## Load Schema

```typescript
interface Load {
  id: string;                          // e.g. "DAT-101", "TS-F01", "RELAY-A001", "COYOTE-88201"
  source: 'DAT' | 'Truckstop' | 'AmazonRelay' | 'Coyote';
  equipmentType: 'Dry Van' | 'Reefer' | 'Flatbed';
  brokerName: string;
  brokerRating: number;                // 1.0–5.0
  origin: { city, state, latitude, longitude };
  destination: { city, state, latitude, longitude };
  pickupDate: string;                  // ISO date
  deliveryDate: string;
  rate: number;                        // Total linehaul in USD
  miles: number;
  rpm: number;                         // Rate per mile
  totalMiles: number;
  weightLbs: number;
}
```
