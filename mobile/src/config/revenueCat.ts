// RevenueCat configuration
// API keys are loaded from environment variables. For local development,
// copy .env.example → .env and fill in your keys.
// For EAS builds, set secrets with: eas secret:create --name KEY --value "..."

import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

/**
 * RevenueCat public API key for Android.
 * Get this from RevenueCat Dashboard → Project Settings → API Keys.
 */
export const REVENUECAT_API_KEY_ANDROID: string =
  extra.revenuecatApiKeyAndroid ??
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ??
  '';

/**
 * RevenueCat public API key for iOS.
 * Get this from RevenueCat Dashboard → Project Settings → API Keys.
 */
export const REVENUECAT_API_KEY_IOS: string =
  extra.revenuecatApiKeyIos ??
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ??
  '';

/**
 * Default offering ID to fetch. If empty, RevenueCat returns the current offering.
 * Use this for A/B testing different paywalls.
 */
export const REVENUECAT_OFFERING_ID: string =
  extra.revenuecatOfferingId ??
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ??
  'default';

// ───────────────────────────────────────────────────────────────
// Offering → Tier Mapping
// These must match the product identifiers configured in
// RevenueCat Dashboard → Products & Entitlements.
// ───────────────────────────────────────────────────────────────

export type RevenueCatTierId = 'free' | 'solo' | 'fleet' | 'enterprise';

export interface TierConfig {
  tierId: RevenueCatTierId;
  displayName: string;
  monthlyPriceUsd: number;
  revenueCatProductId: string;
  revenueCatEntitlementId: string;
  stripePriceId?: string;
}

export const TIER_CONFIG: Record<RevenueCatTierId, TierConfig> = {
  free: {
    tierId: 'free',
    displayName: 'Free',
    monthlyPriceUsd: 0,
    revenueCatProductId: 'phi_free',
    revenueCatEntitlementId: 'phi_free',
  },
  solo: {
    tierId: 'solo',
    displayName: 'Solo',
    monthlyPriceUsd: 49,
    revenueCatProductId: 'phi_solo_monthly',
    revenueCatEntitlementId: 'phi_solo',
  },
  fleet: {
    tierId: 'fleet',
    displayName: 'Fleet',
    monthlyPriceUsd: 149,
    revenueCatProductId: 'phi_fleet_monthly',
    revenueCatEntitlementId: 'phi_fleet',
  },
  enterprise: {
    tierId: 'enterprise',
    displayName: 'Enterprise',
    monthlyPriceUsd: 399,
    revenueCatProductId: 'phi_enterprise_monthly',
    revenueCatEntitlementId: 'phi_enterprise',
  },
};

/**
 * List of all paid tier configs (excluding Free).
 * Useful for rendering subscription cards dynamically.
 */
export const PAID_TIERS: TierConfig[] = [
  TIER_CONFIG.solo,
  TIER_CONFIG.fleet,
  TIER_CONFIG.enterprise,
];
