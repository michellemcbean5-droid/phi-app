# PHI Monetization Guide

> Complete monetization strategy, tier system, pricing, and promo code documentation for Prince Haul Intelligence.

---

## 1. Tier Overview

PHI uses a **freemium model** with 4 subscription tiers. The free tier is genuinely production-ready — users can run the full 10-worker AI stack with their own free API key.

| Tier | Monthly Price | Annual Price | Target User |
|------|--------------|-------------|-------------|
| **Free** | $0 | $0 | Solo owner-operators, new drivers |
| **Solo** | $49/mo | $499/yr (15% off) | Solo drivers wanting unlimited storage |
| **Fleet** | $149/mo | $1,499/yr (16% off) | Small fleets (2-5 trucks) |
| **Enterprise** | $399/mo | $3,999/yr (17% off) | Large fleets, dispatch services |

---

## 2. Feature Matrix by Tier

| Feature | Free | Solo | Fleet | Enterprise |
|---------|------|------|-------|------------|
| **AI Workers** (all 10) | ✅ (BYOK) | ✅ (BYOK) | ✅ (BYOK) | ✅ (Managed AI) |
| **Load Discovery** | ✅ | ✅ | ✅ | ✅ |
| **Route Analysis** | ✅ | ✅ | ✅ | ✅ |
| **Compliance Monitoring** | ✅ | ✅ | ✅ | ✅ |
| **Document Storage** | 20 docs | Unlimited | Unlimited | Unlimited |
| **Truck/Van Profiles** | 1 | 1 | 5 | Unlimited |
| **Proximity Alerts** | 5-min refresh | 1-min refresh | 1-min refresh | Real-time |
| **Fuel Optimization** | ✅ | ✅ | ✅ | ✅ |
| **Earnings Tracking** | ✅ | ✅ | ✅ | ✅ |
| **Dispatcher Radio** | ✅ | ✅ | ✅ | ✅ |
| **Support Chat (Michelle)** | ✅ | ✅ | ✅ | ✅ |
| **Ad-Free Experience** | ❌ (ads) | ✅ | ✅ | ✅ |
| **Priority Support** | Community | Email | Email + Chat | Dedicated |
| **Managed AI** (no key setup) | ❌ | ❌ | ❌ | ✅ |
| **Enterprise Analytics** | ❌ | ❌ | ❌ | ✅ |
| **Custom Integrations** | ❌ | ❌ | ❌ | ✅ |
| **API Access** | ❌ | ❌ | ❌ | ✅ |
| **White-Label Option** | ❌ | ❌ | ❌ | ✅ |

> **BYOK** = Bring Your Own Key (user provides free Anthropic API key)  
> **Managed AI** = PHI runs AI on our infrastructure, no key setup needed

---

## 3. Ad Strategy (Free Tier)

### Ad Types

| Type | Placement | Frequency | Revenue Estimate |
|------|-----------|-----------|-----------------|
| **Banner Ads** | Bottom of Dashboard, Loads, Earnings screens | Always visible | ~$2-5 CPM |
| **Interstitial Ads** | Between screen transitions (LoadDetails → Booking) | Every 3-5 transitions | ~$15-30 CPM |
| **Rewarded Ads** | Unlock premium feature temporarily | User-initiated | ~$50-100 CPM |

### Rewarded Ad Rewards
- Watch 30-sec ad → Unlock 1-hour of 1-minute proximity alerts
- Watch 30-sec ad → Temporarily increase document limit to 50
- Watch 30-sec ad → Unlock Fleet tier features for 24 hours

### Ad Implementation
- **Library:** `react-native-google-mobile-ads`
- **Test IDs:** Used in development (no real ads)
- **Production IDs:** Configured in `app.json` via environment variables
- **AdMob Account:** Required for production (admob.google.com)

---

## 4. Subscription Billing

### Google Play Billing (Android)

**Products configured in Play Console:**
- `phi_solo_monthly` — $49.99/mo
- `phi_fleet_monthly` — $149.99/mo
- `phi_enterprise_monthly` — $399.99/mo

**Implementation:** `react-native-iap`
- `initBilling()` — Connect to Play Billing
- `fetchSubscriptionPlans()` — Get live prices
- `purchaseTier()` — Initiate purchase flow
- `listenForPurchases()` — Handle purchase completion
- `restoreActiveTier()` — Restore after reinstall

### RevenueCat (Cross-Platform)

**Products configured in RevenueCat Dashboard:**
- `phi_solo` — Entitlement: `phi_solo`
- `phi_fleet` — Entitlement: `phi_fleet`
- `phi_enterprise` — Entitlement: `phi_enterprise`

**Implementation:** `react-native-purchases`
- `initRevenueCat()` — Configure SDK
- `fetchOfferings()` — Get packages
- `purchasePackage()` — Buy subscription
- `getCustomerInfo()` — Check active entitlements
- `listenForCustomerInfoUpdates()` — Handle renewals/cancellations

**Why both?**
- Google Play Billing: Direct Android integration, lower latency
- RevenueCat: Cross-platform (iOS + Android), analytics, A/B testing

---

## 5. Promo Code System

### Built-in Promo Codes

| Code | Tier | Duration | Description |
|------|------|----------|-------------|
| `PHIFREE30` | Enterprise | 30 days | Full Enterprise trial |
| `OWNER1TRUCK` | Solo | 14 days | Solo tier for owner-operators |
| `PHITEST` | Fleet | 7 days | Fleet tier testing |
| `PHIVIP` | Enterprise | 60 days | VIP extended trial |
| `PHIFIRSTRUN` | Fleet | 30 days | New driver welcome |

### How Promo Codes Work
1. User enters code in PromoCodeScreen or SubscriptionScreen
2. `applyPromoCode()` validates against `PROMO_CODES` map
3. Sets `activeTier`, `trialExpiresAt`, `paymentStatus: 'trial'`
4. Persists to AsyncStorage via Zustand persist middleware
5. `getEffectiveTier()` checks expiration — falls back to Free after trial ends

### Master Access Code

**Purpose:** Unlock Elite tier for owner testing, demos, internal use.

**Configuration:**
- Set `EXPO_PUBLIC_MASTER_ACCESS_CODE` in environment
- Code is checked in `subscriptionGating.ts` → `hasMasterAccess()`
- Never committed to git — use `.env` only

**Example .env:**
```env
EXPO_PUBLIC_MASTER_ACCESS_CODE=PHI-OWNER-2026-ELITE
```

**Security:**
- Master code is SHA-256 hashed before comparison
- Rate-limited: max 5 attempts per hour per device
- Logged to analytics (anonymized)

---

## 6. Referral System

### How It Works
1. User gets unique referral code (e.g., `PHI-MARCUS-42`)
2. Share via SMS, email, social media
3. New user signs up with referral code
4. Both get rewards:
   - **Referrer:** 7 days Solo tier + $10 AdMob credit
   - **Referee:** 14 days Solo tier

### Implementation
- Referral codes stored in `affiliateStore.ts`
- Code generation: `PHI-{username}-{random}`
- Validation: Server-side (future) or client-side with rate limiting
- Rewards: Applied via `applyPromoCode()` with generated referral code

### Affiliate Marketplace
- Equipment marketplace links include `?ref={affiliateId}`
- Partners: Arrow Truck Sales, Truck Paper, Ryder, Penske, Enterprise
- Commission: Varies by partner (typically 1-3% of sale)

---

## 7. Analytics & Revenue Tracking

### Events Tracked

| Event | Properties | Purpose |
|-------|-----------|---------|
| `subscription_purchased` | tier, price, currency | Revenue tracking |
| `subscription_cancelled` | tier, reason | Churn analysis |
| `promo_code_redeemed` | code, tier, days | Promo effectiveness |
| `ad_impression` | type, screen | Ad revenue tracking |
| `ad_clicked` | type, screen | Ad engagement |
| `tier_upgraded` | from_tier, to_tier | Conversion funnel |
| `trial_ended` | tier, converted | Trial conversion rate |

### Revenue Metrics

| Metric | Target | Tracking |
|--------|--------|----------|
| Free → Solo conversion | 5% | Firebase Analytics + RevenueCat |
| Solo → Fleet conversion | 15% | RevenueCat cohorts |
| Fleet → Enterprise conversion | 10% | RevenueCat cohorts |
| Trial → Paid conversion | 20% | Promo store + RevenueCat |
| Ad revenue per free user | $3-5/mo | AdMob dashboard |
| LTV (Solo) | $300+ | RevenueCat + custom analytics |
| LTV (Enterprise) | $2,000+ | RevenueCat + custom analytics |

---

## 8. Pricing Strategy Rationale

### Why Free Tier is Fully Functional
- **Market positioning:** DAT charges $189/mo for basic features. PHI free tier matches that.
- **Network effects:** More users = more load data = better AI recommendations.
- **Word of mouth:** Free users become evangelists. 80% of trucking recommendations come from other drivers.
- **Ad revenue:** Free users generate $3-5/mo in ad revenue. At scale, this funds infrastructure.

### Why Solo is $49/mo (not $29 or $99)
- **Anchor:** DAT Power is $189/mo. $49 feels like a bargain.
- **Value prop:** Unlimited documents + priority alerts = tangible value for busy drivers.
- **Price elasticity:** $49 is a "no-brainer" for drivers earning $5K+/week.

### Why Fleet is $149/mo
- **Per-truck math:** $149/5 trucks = $30/truck. Cheaper than DAT per truck.
- **Feature unlock:** Multi-truck management is a hard gate — fleet owners will pay.
- **Competitive:** Truckstop Advanced is $209/mo. PHI Fleet undercuts with more features.

### Why Enterprise is $399/mo
- **Managed AI:** Eliminates API key friction — huge value for non-technical fleet managers.
- **White-label:** Future feature for dispatch services to rebrand PHI.
- **API access:** Enables integrations with TMS, ELD, accounting software.
- **Anchor effect:** Makes Fleet ($149) and Solo ($49) look like bargains.

---

## 9. Implementation Files

| File | Purpose |
|------|---------|
| `mobile/src/utils/subscriptionGating.ts` | Tier definitions, feature access checks |
| `mobile/src/store/promoStore.ts` | Promo code state, trial tracking |
| `mobile/src/api/googlePlayBilling.ts` | Google Play Billing integration |
| `mobile/src/api/revenueCatBilling.ts` | RevenueCat cross-platform billing |
| `mobile/src/api/adMob.ts` | AdMob banner, interstitial, rewarded ads |
| `mobile/src/config/revenueCat.ts` | RevenueCat configuration, tier mapping |
| `mobile/src/screens/SubscriptionScreen.tsx` | Subscription UI, plan selection |
| `mobile/src/screens/PromoCodeScreen.tsx` | Promo code entry and redemption |
| `mobile/src/store/affiliateStore.ts` | Referral/affiliate ID tracking |

---

## 10. Future Monetization Ideas

1. **PHI Insurance Marketplace** — Partner with trucking insurance providers, take referral fee
2. **Fuel Card Integration** — Partner with fuel card companies, earn per-gallon fee
3. **Factoring Service** — Invoice factoring integration, take 1-2% of factored amount
4. **Load Board Premium** — Direct DAT/Truckstop integration, markup subscription
5. **ELD Hardware Sales** — Partner with ELD providers, earn hardware commission
6. **Driver Training Courses** — Online CDL refresher courses, revenue share
7. **Truck Parking Reservations** — Reserve parking spots at truck stops, take booking fee

---

*Last updated: 2026-07-08*
