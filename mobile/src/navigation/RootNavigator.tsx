import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PHI_COLORS } from '../assets/brandColors';
import AICommandCenterScreen from '../screens/AICommandCenterScreen';
import APIKeysScreen from '../screens/APIKeysScreen';
import BusinessBlueprintScreen from '../screens/BusinessBlueprintScreen';
import CashFlowScreen from '../screens/CashFlowScreen';
import ComplianceScreen from '../screens/ComplianceScreen';
import DriverCircleScreen from '../screens/DriverCircleScreen';
import DispatcherRadioScreen from '../screens/DispatcherRadioScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import DriverPrefsScreen from '../screens/DriverPrefsScreen';
import EquipmentMarketplaceScreen from '../screens/EquipmentMarketplaceScreen';
import InboxScreen from '../screens/InboxScreen';
import IndependentDispatchHubScreen from '../screens/IndependentDispatchHubScreen';
import LoadDetailsScreen from '../screens/LoadDetailsScreen';
import LoadingScreen from '../screens/LoadingScreen';
import MessageThreadScreen from '../screens/MessageThreadScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PromoCodeScreen from '../screens/PromoCodeScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import PrivacyCenterScreen from '../screens/PrivacyCenterScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SupportChatScreen from '../screens/SupportChatScreen';
import TruckStopFinderScreen from '../screens/TruckStopFinderScreen';
import VehicleScreen from '../screens/VehicleScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Loading: undefined;
  Welcome: undefined;
  Main: undefined;
  LoadDetails: { loadId: string };
  AICommandCenter: undefined;
  Compliance: undefined;
  BusinessBlueprint: undefined;
  DriverCircle: undefined;
  IndependentDispatchHub: undefined;
  CashFlow: undefined;
  PrivacyCenter: undefined;
  Documents: undefined;
  Notifications: undefined;
  Settings: undefined;
  Vehicle: undefined;
  Subscription: undefined;
  PromoCode: undefined;
  APIKeys: undefined;
  DriverPrefs: undefined;
  DispatcherRadio: undefined;
  Inbox: undefined;
  MessageThread: { threadId: string };
  EquipmentMarketplace: undefined;
  SupportChat: undefined;
  TruckStopFinder: undefined;
  PaymentHistory: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Loading"
      screenOptions={{
        headerStyle: { backgroundColor: PHI_COLORS.royalBlue },
        headerTintColor: PHI_COLORS.white,
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: PHI_COLORS.surface },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="LoadDetails" component={LoadDetailsScreen} options={{ title: 'Load Details' }} />
      <Stack.Screen name="AICommandCenter" component={AICommandCenterScreen} options={{ title: 'AI Command Center' }} />
      <Stack.Screen name="Compliance" component={ComplianceScreen} options={{ title: 'Compliance' }} />
      <Stack.Screen name="BusinessBlueprint" component={BusinessBlueprintScreen} options={{ title: 'Business Blueprint' }} />
      <Stack.Screen name="DriverCircle" component={DriverCircleScreen} options={{ title: 'Driver’s Circle' }} />
      <Stack.Screen name="IndependentDispatchHub" component={IndependentDispatchHubScreen} options={{ title: 'Dispatch Hub' }} />
      <Stack.Screen name="CashFlow" component={CashFlowScreen} options={{ title: 'Cash Flow' }} />
      <Stack.Screen name="PrivacyCenter" component={PrivacyCenterScreen} options={{ title: 'Privacy Center' }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Documents' }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Vehicle" component={VehicleScreen} options={{ title: 'Vehicle' }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
      <Stack.Screen name="PromoCode" component={PromoCodeScreen} options={{ title: 'Promo Codes' }} />
      <Stack.Screen name="APIKeys" component={APIKeysScreen} options={{ title: 'API Keys' }} />
      <Stack.Screen name="DriverPrefs" component={DriverPrefsScreen} options={{ title: 'AI Dispatcher Settings' }} />
      <Stack.Screen name="DispatcherRadio" component={DispatcherRadioScreen} options={{ title: 'Dispatcher Radio' }} />
      <Stack.Screen name="Inbox" component={InboxScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="MessageThread" component={MessageThreadScreen} options={{ title: 'Conversation' }} />
      <Stack.Screen name="EquipmentMarketplace" component={EquipmentMarketplaceScreen} options={{ title: 'Truck & Van Marketplace' }} />
      <Stack.Screen
        name="SupportChat"
        component={SupportChatScreen}
        options={{ title: 'Ask Michelle', presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="TruckStopFinder" component={TruckStopFinderScreen} options={{ title: 'Truck Stops & Parking' }} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'Payment History' }} />
    </Stack.Navigator>
  );
}
