import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import LoadDetailsScreen from '../screens/LoadDetailsScreen';

export type RootStackParamList = {
  Main: undefined;
  LoadDetails: { loadId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LoadDetails"
        component={LoadDetailsScreen}
        options={{ title: 'Load Details' }}
      />
    </Stack.Navigator>
  );
}
