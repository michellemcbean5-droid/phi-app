import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { initAnalytics, trackScreenView } from './src/config/analytics';
import { initRevenueCat } from './src/api/revenueCatBilling';
import { initAdMob, preloadAds } from './src/api/adMob';

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
  }, []);

  return (
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
  );
}
