import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PHI_COLORS } from '../assets/brandColors';
import AICommandCenterScreen from '../screens/AICommandCenterScreen';
import APIKeysScreen from '../screens/APIKeysScreen';
import ComplianceScreen from '../screens/ComplianceScreen';
import CoDriverScreen from '../screens/CoDriverScreen';
import DispatcherRadioScreen from '../screens/DispatcherRadioScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import DriverFeedScreen from '../screens/DriverFeedScreen';
import DriverPrefsScreen from '../screens/DriverPrefsScreen';
import EquipmentMarketplaceScreen from '../screens/EquipmentMarketplaceScreen';
import InboxScreen from '../screens/InboxScreen';
import LoadBoardsScreen from '../screens/LoadBoardsScreen';
import LoadDetailsScreen from '../screens/LoadDetailsScreen';
import LoadBoardStatusScreen from '../screens/LoadBoardStatusScreen';
import LoadingScreen from '../screens/LoadingScreen';
import MessageThreadScreen from '../screens/MessageThreadScreen';
import MissionControlScreen from '../screens/MissionControlScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OnboardingWizardScreen from '../screens/OnboardingWizardScreen';
import PromoCodeScreen from '../screens/PromoCodeScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import RadioScreen from '../screens/RadioScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import SupportChatScreen from '../screens/SupportChatScreen';
import TruckStopFinderScreen from '../screens/TruckStopFinderScreen';
import VehicleScreen from '../screens/VehicleScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import BusinessLaunchScreen from '../screens/BusinessLaunchScreen';
import AgentWorkflowMapScreen from '../screens/AgentWorkflowMapScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Loading: undefined;
  Welcome: undefined;
  Main: undefined;
  LoadDetails: { loadId: string };
  AICommandCenter: undefined;
  Compliance: undefined;
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
  LoadBoardStatus: undefined;
  // New screens
  LoadBoards: undefined;
  MissionControl: undefined;
  CoDriver: undefined;
  DriverFeed: undefined;
  Radio: undefined;
  OnboardingWizard: undefined;
  BusinessLaunch: undefined;
  AgentWorkflowMap: undefined;
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
      <Stack.Screen name="LoadBoardStatus" component={LoadBoardStatusScreen} options={{ title: 'Load Board Status' }} />
      {/* New screens */}
      <Stack.Screen name="LoadBoards" component={LoadBoardsScreen} options={{ title: '5 Load Boards' }} />
      <Stack.Screen name="MissionControl" component={MissionControlScreen} options={{ title: 'Mission Control' }} />
      <Stack.Screen name="CoDriver" component={CoDriverScreen} options={{ title: 'Find a Co-Driver' }} />
      <Stack.Screen name="DriverFeed" component={DriverFeedScreen} options={{ title: 'Driver Feed' }} />
      <Stack.Screen name="Radio" component={RadioScreen} options={{ title: 'Dispatch Radio', headerStyle: { backgroundColor: '#0D1525' } }} />
      <Stack.Screen
        name="OnboardingWizard"
        component={OnboardingWizardScreen}
        options={{ title: 'Set Up Your Business', presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="BusinessLaunch" component={BusinessLaunchScreen} options={{ title: 'Start Your Business' }} />
      <Stack.Screen name="AgentWorkflowMap" component={AgentWorkflowMapScreen} options={{ title: 'AI Agent Workflow', headerStyle: { backgroundColor: '#0D1D35' } }} />
    </Stack.Navigator>
  );
}
