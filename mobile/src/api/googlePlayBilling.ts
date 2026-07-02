// Real Google Play Billing (subscriptions) via react-native-iap.
//
// IMPORTANT — this client code alone is not enough to take real payments. Before any
// purchase can succeed you (the app owner) must, in your own Google Play Console:
//   1. Create the app listing and upload at least an Internal Testing build.
//   2. Create 3 subscription products with these exact product IDs:
//        phi_solo_monthly, phi_fleet_monthly, phi_enterprise_monthly
//      (each with a base plan + price — the price shown in-app comes from Play, not this code).
//   3. Add your own Google account as a license tester so test purchases don't charge you.
// A sideloaded/debug APK cannot complete a real purchase — the app must be installed
// through Play (even an internal test track) for Play Billing to recognize it.

import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
  type Subscription,
  type SubscriptionAndroid,
  type Purchase,
} from 'react-native-iap';
import { UserTier } from '../utils/subscriptionGating';

export const SUBSCRIPTION_SKUS: Record<'Solo' | 'Fleet' | 'Enterprise', string> = {
  Solo: 'phi_solo_monthly',
  Fleet: 'phi_fleet_monthly',
  Enterprise: 'phi_enterprise_monthly',
};

const SKU_TO_TIER: Record<string, UserTier> = {
  [SUBSCRIPTION_SKUS.Solo]: 'Solo',
  [SUBSCRIPTION_SKUS.Fleet]: 'Fleet',
  [SUBSCRIPTION_SKUS.Enterprise]: 'Enterprise',
};

export const tierForSku = (sku: string): UserTier | null => SKU_TO_TIER[sku] ?? null;

export const isBillingSupported = (): boolean => Platform.OS === 'android';

/** Connects to Google Play Billing. Returns false (never throws) if unavailable — e.g. no Play Services, or a sideloaded build not installed through Play. */
export const initBilling = async (): Promise<boolean> => {
  if (!isBillingSupported()) return false;
  try {
    await initConnection();
    return true;
  } catch {
    return false;
  }
};

export const endBilling = async (): Promise<void> => {
  try {
    await endConnection();
  } catch {
    // Ignore — nothing to clean up if it never connected.
  }
};

/** Fetches live prices/titles from Play Console for the 3 paid tiers. Empty array if billing is unavailable. */
export const fetchSubscriptionPlans = async (): Promise<Subscription[]> => {
  try {
    return await getSubscriptions({ skus: Object.values(SUBSCRIPTION_SKUS) });
  } catch {
    return [];
  }
};

/** Kicks off the real Play purchase sheet for a tier. Resolves once the OS purchase flow completes; the actual entitlement grant happens in the purchaseUpdatedListener. */
export const purchaseTier = async (tier: 'Solo' | 'Fleet' | 'Enterprise'): Promise<{ started: boolean; message: string }> => {
  if (!isBillingSupported()) {
    return { started: false, message: 'Google Play Billing is only available on Android.' };
  }

  const sku = SUBSCRIPTION_SKUS[tier];
  const plans = await fetchSubscriptionPlans();
  const plan = plans.find((p) => p.productId === sku) as SubscriptionAndroid | undefined;
  const offerToken = plan?.subscriptionOfferDetails?.[0]?.offerToken;

  if (!offerToken) {
    return {
      started: false,
      message: 'This plan isn’t set up in the Play Store yet. Make sure the subscription product exists in Google Play Console and the app was installed through Play (not sideloaded).',
    };
  }

  try {
    await requestSubscription({ subscriptionOffers: [{ sku, offerToken }] });
    return { started: true, message: 'Purchase flow started.' };
  } catch (error) {
    return { started: false, message: error instanceof Error ? error.message : 'Purchase could not be started.' };
  }
};

/** Acknowledges a completed purchase with Play so it isn't refunded, and reports which tier to grant. */
export const acknowledgePurchase = async (purchase: Purchase): Promise<UserTier | null> => {
  try {
    await finishTransaction({ purchase, isConsumable: false });
  } catch {
    // Even if acknowledgement fails, still grant the tier locally — Play will retry.
  }
  const productId = 'productId' in purchase ? purchase.productId : undefined;
  return productId ? tierForSku(productId) : null;
};

/** Registers listeners for purchase completion/error. Call the returned cleanup on unmount. */
export const listenForPurchases = (
  onPurchased: (tier: UserTier) => void,
  onError: (message: string) => void,
): (() => void) => {
  const updateSub = purchaseUpdatedListener((purchase) => {
    void acknowledgePurchase(purchase).then((tier) => {
      if (tier) onPurchased(tier);
    });
  });
  const errorSub = purchaseErrorListener((error) => {
    onError(error.message ?? 'Purchase failed.');
  });
  return () => {
    updateSub.remove();
    errorSub.remove();
  };
};

/** Restores whichever subscription is currently active on this Play account (e.g. after reinstall). */
export const restoreActiveTier = async (): Promise<UserTier | null> => {
  try {
    const purchases = await getAvailablePurchases();
    for (const purchase of purchases) {
      const productId = 'productId' in purchase ? purchase.productId : undefined;
      const tier = productId ? tierForSku(productId) : null;
      if (tier) return tier;
    }
    return null;
  } catch {
    return null;
  }
};
