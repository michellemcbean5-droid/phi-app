// Analytics & crash reporting configuration for PHI
// Combines Sentry for crash reporting and Firebase Analytics for event tracking.
// Both are optional — the app runs fine if neither is configured.

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

// ───────────────────────────────────────────────────────────────
// Environment-derived config
// ───────────────────────────────────────────────────────────────

export const SENTRY_DSN: string =
  extra.sentryDsn ?? process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export const FIREBASE_API_KEY: string =
  extra.firebaseApiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';

export const FIREBASE_PROJECT_ID: string =
  extra.firebaseProjectId ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '';

export const ADMOB_APP_ID_ANDROID: string =
  extra.admobAppIdAndroid ?? process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID ?? '';

export const ADMOB_APP_ID_IOS: string =
  extra.admobAppIdIos ?? process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS ?? '';

export const APP_VERSION: string = Constants.expoConfig?.version ?? '1.0.0';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ───────────────────────────────────────────────────────────────
// Analytics helpers
// ───────────────────────────────────────────────────────────────

let firebaseAnalytics: typeof import('@react-native-firebase/analytics').default | null = null;

const getFirebaseAnalytics = async () => {
  if (!FIREBASE_API_KEY) return null;
  if (firebaseAnalytics) return firebaseAnalytics;
  try {
    const { default: analytics } = await import('@react-native-firebase/analytics');
    firebaseAnalytics = analytics();
    return firebaseAnalytics;
  } catch {
    return null;
  }
};

/**
 * Initialize analytics stack (Sentry + Firebase).
 * Call once at app startup.
 */
export const initAnalytics = async (): Promise<void> => {
  if (SENTRY_DSN) {
    const { initSentry } = await import('./sentry');
    await initSentry();
  }
  if (FIREBASE_API_KEY) {
    try {
      await getFirebaseAnalytics();
      console.log('[Analytics] Firebase Analytics ready');
    } catch (error) {
      console.warn('[Analytics] Firebase init failed:', error);
    }
  }
};

/**
 * Track a screen view.
 */
export const trackScreenView = async (screenName: string): Promise<void> => {
  const analytics = await getFirebaseAnalytics();
  if (analytics) {
    await analytics.logScreenView({ screen_name: screenName, screen_class: screenName });
  }
  // Also breadcrumb to Sentry if available
  try {
    const Sentry = await import('@sentry/react-native');
    Sentry.addBreadcrumb({ category: 'navigation', message: screenName, level: 'info' });
  } catch {
    // Sentry not loaded
  }
};

/**
 * Track a custom event with optional properties.
 */
export const trackEvent = async (
  eventName: string,
  properties?: Record<string, string | number | boolean>
): Promise<void> => {
  const analytics = await getFirebaseAnalytics();
  if (analytics) {
    await analytics.logEvent(eventName, properties ?? {});
  }
  try {
    const Sentry = await import('@sentry/react-native');
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: eventName,
      data: properties,
      level: 'info',
    });
  } catch {
    // Sentry not loaded
  }
};

/**
 * Track a purchase/subscription event.
 */
export const trackPurchase = async (
  tier: string,
  priceUsd: number,
  currency = 'USD'
): Promise<void> => {
  const analytics = await getFirebaseAnalytics();
  if (analytics) {
    await analytics.logPurchase({
      value: priceUsd,
      currency,
      transaction_id: `${tier}_${Date.now()}`,
    });
  }
  await trackEvent('subscription_purchased', { tier, price: priceUsd, currency });
};

/**
 * Set user properties for segmentation.
 */
export const setUserProperties = async (
  properties: Record<string, string | null>
): Promise<void> => {
  const analytics = await getFirebaseAnalytics();
  if (analytics) {
    for (const [key, value] of Object.entries(properties)) {
      if (value !== null) {
        await analytics.setUserProperty(key, value);
      }
    }
  }
};

/**
 * Set the current user ID across analytics providers.
 */
export const setUserId = async (userId: string | null): Promise<void> => {
  const analytics = await getFirebaseAnalytics();
  if (analytics) {
    await analytics.setUserId(userId);
  }
  try {
    const Sentry = await import('@sentry/react-native');
    Sentry.setUser(userId ? { id: userId } : null);
  } catch {
    // Sentry not loaded
  }
};
