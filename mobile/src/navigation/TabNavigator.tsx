import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import AICommandCenterScreen from '../screens/AICommandCenterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EarningsScreen from '../screens/EarningsScreen';
import LoadsScreen from '../screens/LoadsScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type TabParamList = {
  Dashboard: undefined;
  Loads: undefined;
  AI: undefined;
  Earnings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: PHI_COLORS.royalBlue },
        headerTintColor: PHI_COLORS.white,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: PHI_COLORS.royalBlue, borderTopColor: '#1B4BCC' },
        tabBarActiveTintColor: PHI_COLORS.sunshineYellow,
        tabBarInactiveTintColor: '#D7E3FF',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Loads') iconName = focused ? 'cube' : 'cube-outline';
          else if (route.name === 'AI') iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
          else if (route.name === 'Earnings') iconName = focused ? 'cash' : 'cash-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Loads" component={LoadsScreen} />
      <Tab.Screen name="AI" component={AICommandCenterScreen} options={{ title: 'AI' }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
