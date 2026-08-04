import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initAnalytics, trackScreenView } from './src/config/analytics';
import { initRevenueCat } from './src/api/revenueCatBilling';
import { initAdMob, preloadAds } from './src/api/adMob';
import { initRealtime } from './src/api/realtimeManager';
import useAuthStore from './src/store/authStore';

const extra = Constants.expoConfig?.extra ?? {};
const WS_URL: string = extra.realtimeWsUrl ?? process.env.EXPO_PUBLIC_WS_URL ?? '';

export default function App() {
  useEffect(() => {
    // Initialize analytics, billing, and ads asynchronously
    void initAnalytics();
    void initRevenueCat().then((ready) => {
      if (ready) console.log('[App] RevenueCat ready');
    });
    void initAdMob().then((ready) => {
      if (ready) preloadAds();
    });

    // Initialize real-time connection if URL is configured
    if (WS_URL) {
      initRealtime({
        url: WS_URL,
        getAuthToken: async () => useAuthStore.getState().token ?? '',
        heartbeatIntervalMs: 25000,
        reconnectBaseMs: 1000,
        reconnectMaxMs: 30000,
        offlineQueueLimit: 50,
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer
          onStateChange={(state) => {
            const currentRoute = state?.routes[state.index];
            if (currentRoute?.name) {
              void trackScreenView(currentRoute.name);
            }
          }}
        >
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
