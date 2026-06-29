import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { PHI_COLORS } from './src/assets/brandColors';

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <ErrorBoundary onError={(err) => console.error('Fallback error:', err)}>
      <ErrorBoundary>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PHI_COLORS.background }}>
          <Text style={{ color: PHI_COLORS.white, fontSize: 18, marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ color: PHI_COLORS.textSecondary, fontSize: 14, marginBottom: 20, textAlign: 'center', paddingHorizontal: 20 }}>
            {error.message}
          </Text>
          <TouchableOpacity onPress={resetErrorBoundary} style={{ backgroundColor: PHI_COLORS.royalBlue, padding: 12, borderRadius: 8 }}>
            <Text style={{ color: PHI_COLORS.white }}>Try again</Text>
          </TouchableOpacity>
        </View>
      </ErrorBoundary>
    </ErrorBoundary>
  );
}

// Import View and Text for the fallback
import { View, Text, TouchableOpacity } from 'react-native';

export default function App() {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback error={new Error('App crashed')} resetErrorBoundary={() => window.location.reload()} />}
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
        // Here you could send the error to a monitoring service
      }}
    >
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={PHI_COLORS.royalBlue} />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
