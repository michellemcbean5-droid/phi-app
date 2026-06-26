import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PHI_COLORS } from '../assets/brandColors';
import AICommandCenterScreen from '../screens/AICommandCenterScreen';
import ComplianceScreen from '../screens/ComplianceScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import LoadDetailsScreen from '../screens/LoadDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import VehicleScreen from '../screens/VehicleScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Main: undefined;
  LoadDetails: { loadId: string };
  AICommandCenter: undefined;
  Compliance: undefined;
  Documents: undefined;
  Notifications: undefined;
  Settings: undefined;
  Vehicle: undefined;
  Subscription: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: PHI_COLORS.royalBlue },
        headerTintColor: PHI_COLORS.white,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: PHI_COLORS.surface },
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="LoadDetails" component={LoadDetailsScreen} options={{ title: 'Load Details' }} />
      <Stack.Screen name="AICommandCenter" component={AICommandCenterScreen} options={{ title: 'AI Command Center' }} />
      <Stack.Screen name="Compliance" component={ComplianceScreen} options={{ title: 'Compliance' }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Documents' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Vehicle" component={VehicleScreen} options={{ title: 'Vehicle' }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
    </Stack.Navigator>
  );
}
