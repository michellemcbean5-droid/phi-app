// Test-only stand-in for @stripe/stripe-react-native.
// The real SDK resolves to raw TypeScript sources that bind native modules,
// which cannot load under Node/Vitest. The unit tests exercise the app's own
// payment logic (src/api/stripePayments.ts) — the native SDK is out of scope.

export enum PaymentSheetError {
  Canceled = 'Canceled',
  Failed = 'Failed',
}

interface StripeErrorLike {
  code?: string;
  message: string;
}

interface StripeSheetApi {
  initPaymentSheet(params: Record<string, unknown>): Promise<{ error?: StripeErrorLike }>;
  presentPaymentSheet(): Promise<{ error?: StripeErrorLike }>;
  confirmPaymentSheetPayment(): Promise<{ error?: StripeErrorLike }>;
}

/** Returns null by default, mirroring useStripe outside a <StripeProvider>. */
export const useStripe = (): StripeSheetApi | null => null;

export const StripeProvider = ({ children }: { children?: unknown }): unknown =>
  children ?? null;
