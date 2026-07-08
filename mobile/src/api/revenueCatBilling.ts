// RevenueCat Purchases SDK — cross-platform billing abstraction
// Handles subscriptions on both iOS and Android with a single API.
// Falls back gracefully to the existing react-native-iap implementation on Android
// if RevenueCat is not configured.

import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PurchasesOfferings,
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';
import {
  REVENUECAT_API_KEY_ANDROID,
  REVENUECAT_API_KEY_IOS,
  REVENUECAT_OFFERING_ID,
} from '../config/revenueCat';
import { UserTier } from '../utils/subscriptionGating';

const API_KEY = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

/** Returns true if RevenueCat is configured (has a non-empty API key). */
export const isRevenueCatConfigured = (): boolean => API_KEY.length > 0;

/**
 * Initialize RevenueCat Purchases SDK.
 * Call once at app startup (e.g. in App.tsx useEffect).
 */
export const initRevenueCat = async (): Promise<boolean> => {
  if (!isRevenueCatConfigured()) {
    console.warn('[RevenueCat] Skipping init — no API key configured.');
    return false;
  }
  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey: API_KEY });
    return true;
  } catch (error) {
    console.error('[RevenueCat] Init failed:', error);
    return false;
  }
};

/**
 * Fetch current offerings (packages) from RevenueCat.
 * Returns null if not configured or on error.
 */
export const fetchOfferings = async (): Promise<PurchasesOfferings | null> => {
  if (!isRevenueCatConfigured()) return null;
  try {
    return await Purchases.getOfferings();
  } catch (error) {
    console.error('[RevenueCat] fetchOfferings failed:', error);
    return null;
  }
};

/**
 * Purchase a subscription package.
 * Returns { success: true } on purchase, { success: false, error } on failure.
 */
export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> => {
  if (!isRevenueCatConfigured()) {
    return { success: false, error: 'RevenueCat is not configured.' };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (error: any) {
    // User cancelled is not a real error
    if (error.userCancelled) {
      return { success: false, error: 'User cancelled the purchase.' };
    }
    console.error('[RevenueCat] purchasePackage failed:', error);
    return { success: false, error: error.message ?? 'Purchase failed.' };
  }
};

/**
 * Restore previous purchases (e.g. after reinstall).
 * Returns CustomerInfo so you can check active entitlements.
 */
export const restorePurchases = async (): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> => {
  if (!isRevenueCatConfigured()) {
    return { success: false, error: 'RevenueCat is not configured.' };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, customerInfo };
  } catch (error: any) {
    console.error('[RevenueCat] restorePurchases failed:', error);
    return { success: false, error: error.message ?? 'Restore failed.' };
  }
};

/**
 * Get current customer info (active entitlements, latest expiration dates).
 * Use this to determine subscription status at app launch.
 */
export const getCustomerInfo = async (): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> => {
  if (!isRevenueCatConfigured()) {
    return { success: false, error: 'RevenueCat is not configured.' };
  }
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return { success: true, customerInfo };
  } catch (error: any) {
    console.error('[RevenueCat] getCustomerInfo failed:', error);
    return { success: false, error: error.message ?? 'Could not fetch customer info.' };
  }
};

/**
 * Map RevenueCat entitlement IDs to our internal UserTier.
 * Update these to match your actual entitlement identifiers in RevenueCat dashboard.
 */
const ENTITLEMENT_TO_TIER: Record<string, UserTier> = {
  phi_solo: 'Solo',
  phi_fleet: 'Fleet',
  phi_enterprise: 'Enterprise',
};

/**
 * Derive UserTier from CustomerInfo active entitlements.
 * Returns 'Free' if no paid entitlement is active.
 */
export const tierFromCustomerInfo = (customerInfo: CustomerInfo): UserTier => {
  const active = Object.keys(customerInfo.entitlements.active);
  for (const entitlement of active) {
    const tier = ENTITLEMENT_TO_TIER[entitlement];
    if (tier) return tier;
  }
  return 'Free';
};

/**
 * Listen for customer info updates (purchase completed, renewal, cancellation, refund).
 * Returns an unsubscribe function. Call inside useEffect.
 */
export const listenForCustomerInfoUpdates = (
  onUpdate: (customerInfo: CustomerInfo) => void
): (() => void) => {
  if (!isRevenueCatConfigured()) {
    return () => {}; // no-op
  }
  // react-native-purchases uses an event emitter internally
  // The modern API uses addCustomerInfoUpdateListener
  const unsubscribe = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    onUpdate(customerInfo);
  });
  return unsubscribe;
};

/**
 * Get the default offering ID (useful when you want a specific offering).
 */
export { REVENUECAT_OFFERING_ID };
