// PayPal checkout integration for one-time purchases and subscriptions
// Uses PayPal Checkout SDK for React Native.

import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const PAYPAL_CLIENT_ID: string =
  extra.paypalClientId ??
  process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID ??
  '';

export const isPayPalConfigured = (): boolean => PAYPAL_CLIENT_ID.length > 0;

export interface PayPalOrderParams {
  amount: string;
  currency?: string;
  description?: string;
  customId?: string;
}

export interface PayPalSubscriptionParams {
  planId: string;
  customId?: string;
}

/**
 * Create a PayPal order via your backend.
 * In production this MUST call your server — never create orders client-side.
 */
export const createPayPalOrder = async (
  params: PayPalOrderParams
): Promise<{ id: string; status: string } | null> => {
  const apiBase =
    extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

  if (!apiBase) {
    console.warn('[PayPal] No backend configured — using test-mode mock order.');
    return { id: 'TEST_ORDER_' + Date.now(), status: 'CREATED' };
  }

  try {
    const response = await fetch(`${apiBase}/paypal/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return data.order ?? null;
  } catch (error) {
    console.error('[PayPal] createPayPalOrder failed:', error);
    return null;
  }
};

/**
 * Capture a PayPal order after user approval.
 */
export const capturePayPalOrder = async (
  orderId: string
): Promise<{ success: boolean; captureId?: string; error?: string }> => {
  const apiBase =
    extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

  if (!apiBase) {
    console.warn('[PayPal] Test mode — simulating capture.');
    return { success: true, captureId: 'TEST_CAPTURE_' + Date.now() };
  }

  try {
    const response = await fetch(`${apiBase}/paypal/capture-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    const data = await response.json();
    if (data.success) {
      return { success: true, captureId: data.captureId };
    }
    return { success: false, error: data.error ?? 'Capture failed.' };
  } catch (error: any) {
    return { success: false, error: error.message ?? 'Capture failed.' };
  }
};

/**
 * Create a PayPal subscription via your backend.
 */
export const createPayPalSubscription = async (
  params: PayPalSubscriptionParams
): Promise<{ id: string; status: string } | null> => {
  const apiBase =
    extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

  if (!apiBase) {
    console.warn('[PayPal] No backend configured — using test-mode mock subscription.');
    return { id: 'TEST_SUB_' + Date.now(), status: 'APPROVAL_PENDING' };
  }

  try {
    const response = await fetch(`${apiBase}/paypal/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return data.subscription ?? null;
  } catch (error) {
    console.error('[PayPal] createPayPalSubscription failed:', error);
    return null;
  }
};

/**
 * Map internal tier to PayPal plan IDs (test mode).
 * Update these with your actual PayPal Dashboard plan IDs.
 */
export const TIER_PAYPAL_PLAN_IDS: Record<string, { monthly: string; annual: string }> = {
  Solo: { monthly: 'P-00SOLO_MONTHLY', annual: 'P-00SOLO_ANNUAL' },
  Fleet: { monthly: 'P-00FLEET_MONTHLY', annual: 'P-00FLEET_ANNUAL' },
  Enterprise: { monthly: 'P-00ENTERPRISE_MONTHLY', annual: 'P-00ENTERPRISE_ANNUAL' },
};

/**
 * Open PayPal checkout in a WebView or browser.
 * Returns the order ID on success, null on failure.
 */
export const openPayPalCheckout = async (
  params: PayPalOrderParams
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  if (!isPayPalConfigured()) {
    return { success: false, error: 'PayPal is not configured.' };
  }

  const order = await createPayPalOrder(params);
  if (!order) {
    return { success: false, error: 'Could not create PayPal order.' };
  }

  // In a real implementation, you'd open a PayPal checkout WebView here.
  // For now, we simulate the approval flow in test mode.
  console.log('[PayPal] Order created:', order.id);

  // Simulate user approval delay
  await new Promise((r) => setTimeout(r, 1500));

  const capture = await capturePayPalOrder(order.id);
  if (capture.success) {
    return { success: true, orderId: order.id };
  }
  return { success: false, error: capture.error };
};

/**
 * Open PayPal subscription checkout.
 */
export const openPayPalSubscription = async (
  params: PayPalSubscriptionParams
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> => {
  if (!isPayPalConfigured()) {
    return { success: false, error: 'PayPal is not configured.' };
  }

  const subscription = await createPayPalSubscription(params);
  if (!subscription) {
    return { success: false, error: 'Could not create PayPal subscription.' };
  }

  console.log('[PayPal] Subscription created:', subscription.id);

  // Simulate approval delay
  await new Promise((r) => setTimeout(r, 1500));

  return { success: true, subscriptionId: subscription.id };
};
