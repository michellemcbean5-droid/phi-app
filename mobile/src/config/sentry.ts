// Sentry crash reporting configuration for PHI
// Captures unhandled exceptions, ANRs, and performance traces.

import * as Sentry from '@sentry/react-native';
import { APP_VERSION, SENTRY_DSN, IS_PRODUCTION } from './analytics';

let sentryInitialized = false;

/**
 * Initialize Sentry with the DSN from environment.
 * Call once at app startup before any other code runs.
 */
export const initSentry = (): void => {
  if (sentryInitialized) return;
  if (!SENTRY_DSN) {
    console.warn('[Sentry] Skipping init — no DSN configured.');
    return;
  }
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: IS_PRODUCTION ? 'production' : 'development',
      release: `phi-app@${APP_VERSION}`,
      dist: `${APP_VERSION}.1`,
      debug: !IS_PRODUCTION,
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
      // We recommend adjusting this value in production.
      tracesSampleRate: IS_PRODUCTION ? 0.2 : 1.0,
      // Profiles sample rate is relative to tracesSampleRate
      profilesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
      // Attach stack traces to user feedback
      attachStacktrace: true,
      // Enable auto session tracking
      autoSessionTracking: true,
      // Ignore common non-actionable errors
      ignoreErrors: [
        'Network request failed',
        'Network Error',
        'Request failed with status code',
        'TimeoutError',
        'AbortError',
      ],
      beforeSend: (event) => {
        // Sanitize PII — never send emails or phone numbers
        if (event.user) {
          delete event.user.email;
          delete event.user.phone;
        }
        return event;
      },
    });
    sentryInitialized = true;
    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error);
  }
};

/**
 * Capture an exception and send to Sentry.
 * Safe to call even if Sentry is not initialized.
 */
export const captureException = (error: unknown, context?: Record<string, unknown>): void => {
  if (!sentryInitialized) {
    console.warn('[Sentry] Not initialized — logging to console:', error);
    return;
  }
  Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture a message (non-error) to Sentry.
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info'): void => {
  if (!sentryInitialized) {
    console.log(`[Sentry] ${message}`);
    return;
  }
  Sentry.captureMessage(message, level);
};

/**
 * Add a breadcrumb for debugging context.
 */
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb): void => {
  if (!sentryInitialized) return;
  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Set the current user for Sentry.
 */
export const setSentryUser = (user: { id: string; username?: string } | null): void => {
  if (!sentryInitialized) return;
  Sentry.setUser(user);
};

/**
 * Wrap a React component with Sentry error boundaries.
 */
export const withSentryErrorBoundary = Sentry.withErrorBoundary;
