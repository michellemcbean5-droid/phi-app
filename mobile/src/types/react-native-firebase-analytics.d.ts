// Ambient types for the OPTIONAL @react-native-firebase/analytics native module.
//
// The package is intentionally NOT installed: it requires google-services.json
// plus a config plugin that this app does not ship. src/config/analytics.ts
// loads it lazily via dynamic import() inside try/catch and degrades to
// Sentry-only analytics when the module is absent. If Firebase Analytics is
// ever enabled, install @react-native-firebase/app + analytics and delete
// this file so the real typings are used instead.
declare module '@react-native-firebase/analytics' {
  export interface FirebaseAnalyticsModule {
    logScreenView(params: { screen_name: string; screen_class: string }): Promise<void>;
    logEvent(
      name: string,
      params?: Record<string, string | number | boolean>
    ): Promise<void>;
    logPurchase(params: {
      value: number;
      currency: string;
      transaction_id?: string;
    }): Promise<void>;
    setUserProperty(name: string, value: string): Promise<void>;
    setUserId(userId: string | null): Promise<void>;
  }

  const analytics: () => FirebaseAnalyticsModule;
  export default analytics;
}
