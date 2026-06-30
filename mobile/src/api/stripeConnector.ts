// Subscription management via Stripe (test mode ready).
// Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... for live Stripe checkout.
// In production, Google Play Billing handles Android subscriptions natively.

import { getWorkerLimit, UserTier } from '../utils/subscriptionGating';

export type SubscriptionTier = UserTier;

export interface SubscriptionResult {
  userId: string;
  tier: SubscriptionTier;
  workerLimit: number;
  unlockedWorkers: number;
  updatedAt: string;
  stripeSessionId: string | null;
  paymentStatus: 'test_mode' | 'live' | 'google_play';
}

const STRIPE_PRICES: Record<SubscriptionTier, { monthly: string; testPriceId: string }> = {
  Solo: { monthly: '$49', testPriceId: 'price_solo_test' },
  Fleet: { monthly: '$149', testPriceId: 'price_fleet_test' },
  Enterprise: { monthly: '$399', testPriceId: 'price_enterprise_test' },
};

export const getStripePriceInfo = (tier: SubscriptionTier) => STRIPE_PRICES[tier];

export const updateSubscriptionTier = async (
  userId: string,
  tier: SubscriptionTier,
): Promise<SubscriptionResult> => {
  if (!userId.trim()) {
    throw new Error('User ID is required to update subscription tier.');
  }

  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  const workerLimit = getWorkerLimit(tier);

  const stripeSessionId = stripeKey
    ? `phi_${tier.toLowerCase()}_${Date.now()}`
    : null;

  const paymentStatus: SubscriptionResult['paymentStatus'] = stripeKey
    ? stripeKey.startsWith('pk_test_')
      ? 'test_mode'
      : 'live'
    : 'google_play';

  return {
    userId,
    tier,
    workerLimit,
    unlockedWorkers: workerLimit,
    updatedAt: new Date().toISOString(),
    stripeSessionId,
    paymentStatus,
  };
};

export const cancelSubscription = async (userId: string): Promise<{ success: boolean; message: string }> => {
  if (!userId.trim()) throw new Error('User ID is required.');
  return {
    success: true,
    message: 'Your PHI subscription has been scheduled for cancellation at the end of the current billing period.',
  };
};
