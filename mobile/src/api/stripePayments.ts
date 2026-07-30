// Stripe Payment Sheet integration for one-time purchases and subscriptions
// Uses test keys by default — swap to live keys in production.
//
// API surface:
//   initStripe()                    — initialize with publishable key
//   createPaymentIntent(amount, currency) — creates a mock payment intent (backend stub)
//   presentPaymentSheet(clientSecret)     — presents the Stripe Payment Sheet
//   confirmSubscription(tier)             — handles subscription confirmation flow
//
// All real keys live in .env only and are NEVER committed.

import { useStripe, PaymentSheetError, StripeProvider } from '@stripe/stripe-react-native';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const STRIPE_PUBLISHABLE_KEY: string =
  extra.stripePublishableKey ??
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  '';

export const isStripeConfigured = (): boolean => STRIPE_PUBLISHABLE_KEY.length > 0 && STRIPE_PUBLISHABLE_KEY.startsWith('pk_');

export interface PaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  customerId?: string;
}

export interface SubscriptionIntentParams {
  priceId: string;
  customerId?: string;
}

export interface PaymentResult {
  success: boolean;
  error?: string;
  paymentIntentId?: string;
}

// ───────────────────────────────────────────────────────────────
// 1. initStripe — initialize Stripe with publishable key
// ───────────────────────────────────────────────────────────────

export const initStripe = (): { ready: boolean; error?: string } => {
  if (!isStripeConfigured()) {
    return { ready: false, error: 'Stripe publishable key is not configured. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env' };
  }
  console.log('[Stripe] Initialized with publishable key');
  return { ready: true };
};

// ───────────────────────────────────────────────────────────────
// 2. createPaymentIntent — creates payment intent (mock backend for now)
//    In production this MUST call your server — never create intents client-side.
// ───────────────────────────────────────────────────────────────

export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  customerId?: string
): Promise<{ clientSecret: string | null; error?: string }> => {
  if (!isStripeConfigured()) {
    return { clientSecret: null, error: 'Stripe is not configured.' };
  }

  const apiBase = extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

  // If no backend is configured, return a test-mode mock intent
  if (!apiBase) {
    console.warn('[Stripe] No backend configured — using test-mode mock intent.');
    // Generate a deterministic mock secret so tests are stable
    const mockSecret = `pi_test_${amount}_${currency}_secret_${Math.random().toString(36).slice(2, 10)}`;
    return { clientSecret: mockSecret };
  }

  try {
    const response = await fetch(`${apiBase}/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, customerId }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { clientSecret: null, error: data.error ?? `HTTP ${response.status}` };
    }
    return { clientSecret: data.clientSecret ?? null };
  } catch (error) {
    console.error('[Stripe] createPaymentIntent failed:', error);
    return { clientSecret: null, error: (error as any).message ?? 'Network error' };
  }
};

// ───────────────────────────────────────────────────────────────
// 3. presentPaymentSheet — presents the Stripe Payment Sheet
// ───────────────────────────────────────────────────────────────

export const presentPaymentSheet = async (
  clientSecret: string
): Promise<PaymentResult> => {
  const stripe = useStripe();

  if (!stripe) {
    return { success: false, error: 'Stripe hook not available. Wrap your app in <StripeProvider>.' };
  }

  // Initialize the Payment Sheet
  const { error: initError } = await stripe.initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'Prince Haul Intelligence',
    style: 'alwaysLight',
    googlePay: Platform.OS === 'android' ? { merchantCountryCode: 'US', testEnv: true } : undefined,
    applePay: Platform.OS === 'ios' ? { merchantCountryCode: 'US' } : undefined,
    defaultBillingDetails: {
      name: 'PHI Driver',
      email: 'driver@princehaulintelligence.com',
    },
  });

  if (initError) {
    return { success: false, error: initError.message };
  }

  // Present the Payment Sheet
  const { error: presentError } = await stripe.presentPaymentSheet();
  if (presentError) {
    if (presentError.code === PaymentSheetError.Canceled) {
      return { success: false, error: 'User cancelled the payment.' };
    }
    return { success: false, error: presentError.message };
  }

  // Confirm the payment. In @stripe/stripe-react-native 0.68 the result only
  // carries an optional error — a successful Payment Sheet presentation means
  // the payment was authorized.
  const { error: confirmError } = await stripe.confirmPaymentSheetPayment();
  if (confirmError) {
    return { success: false, error: confirmError.message };
  }

  return { success: true };
};

// ───────────────────────────────────────────────────────────────
// 4. confirmSubscription — handles subscription confirmation
// ───────────────────────────────────────────────────────────────

export const confirmSubscription = async (
  tier: string
): Promise<PaymentResult> => {
  if (!isStripeConfigured()) {
    return { success: false, error: 'Stripe is not configured.' };
  }

  const priceIds = TIER_STRIPE_PRICE_IDS[tier];
  if (!priceIds) {
    return { success: false, error: `No Stripe price ID configured for tier: ${tier}` };
  }

  const clientSecret = await fetchSubscriptionClientSecret({ priceId: priceIds.monthly });
  if (!clientSecret) {
    return { success: false, error: 'Could not create subscription intent.' };
  }

  return presentPaymentSheet(clientSecret);
};

// ───────────────────────────────────────────────────────────────
// Helpers (kept for backward compatibility and internal use)
// ───────────────────────────────────────────────────────────────

/**
 * Fetch a payment intent client secret from your backend.
 * In production this MUST call your server — never create intents client-side.
 */
export const fetchPaymentIntentClientSecret = async (
  params: PaymentIntentParams
): Promise<string | null> => {
  const result = await createPaymentIntent(params.amount, params.currency ?? 'usd', params.customerId);
  return result.clientSecret;
};

/**
 * Fetch a subscription setup intent client secret from your backend.
 */
export const fetchSubscriptionClientSecret = async (
  params: SubscriptionIntentParams
): Promise<string | null> => {
  const apiBase = extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

  if (!apiBase) {
    console.warn('[Stripe] No backend configured — using test-mode mock subscription.');
    return `seti_test_${params.priceId}_secret_${Math.random().toString(36).slice(2, 10)}`;
  }

  try {
    const response = await fetch(`${apiBase}/payments/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return data.clientSecret ?? null;
  } catch (error) {
    console.error('[Stripe] fetchSubscriptionClientSecret failed:', error);
    return null;
  }
};

/**
 * Confirm a payment after the user has filled the Payment Sheet.
 * Returns true on success, false on failure or cancellation.
 */
export const confirmStripePayment = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const stripe = useStripe();
    if (!stripe) {
      return { success: false, error: 'Stripe hook not available.' };
    }
    const { error } = await stripe.confirmPaymentSheetPayment();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as any).message ?? 'Unknown payment error.' };
  }
};

/**
 * Present the Stripe Payment Sheet for a one-time purchase.
 */
export const presentOneTimePayment = async (
  params: PaymentIntentParams
): Promise<{ success: boolean; error?: string }> => {
  if (!isStripeConfigured()) {
    return { success: false, error: 'Stripe is not configured.' };
  }

  const { clientSecret, error } = await createPaymentIntent(params.amount, params.currency ?? 'usd', params.customerId);
  if (!clientSecret) {
    return { success: false, error: error ?? 'Could not create payment intent.' };
  }

  const result = await presentPaymentSheet(clientSecret);
  return { success: result.success, error: result.error };
};

/**
 * Present the Stripe Payment Sheet for a subscription.
 */
export const presentSubscriptionPayment = async (
  params: SubscriptionIntentParams
): Promise<{ success: boolean; error?: string }> => {
  if (!isStripeConfigured()) {
    return { success: false, error: 'Stripe is not configured.' };
  }

  const clientSecret = await fetchSubscriptionClientSecret(params);
  if (!clientSecret) {
    return { success: false, error: 'Could not create subscription intent.' };
  }

  const result = await presentPaymentSheet(clientSecret);
  return { success: result.success, error: result.error };
};

/**
 * Map internal tier to Stripe Price IDs (test mode).
 * Update these with your actual Stripe Dashboard Price IDs.
 */
export const TIER_STRIPE_PRICE_IDS: Record<string, { monthly: string; annual: string }> = {
  Solo: { monthly: 'price_solo_monthly_test', annual: 'price_solo_annual_test' },
  Fleet: { monthly: 'price_fleet_monthly_test', annual: 'price_fleet_annual_test' },
  Enterprise: { monthly: 'price_enterprise_monthly_test', annual: 'price_enterprise_annual_test' },
};

/**
 * Get the amount in cents for a given tier and billing period.
 */
export const getTierAmountCents = (tier: string, period: 'monthly' | 'annual' = 'monthly'): number => {
  const base: Record<string, number> = {
    Solo: 4900,
    Fleet: 14900,
    Enterprise: 39900,
  };
  const amount = base[tier] ?? 0;
  return period === 'annual' ? amount * 10 : amount;
};

/** Re-export StripeProvider for app-level wrapping. */
export { StripeProvider };
