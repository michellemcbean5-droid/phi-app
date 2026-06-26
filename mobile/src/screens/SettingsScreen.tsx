import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import { rotateAPIKey } from '../utils/encryption';

const keyNames = ['DAT_API_KEY', 'TWILIO_API_KEY', 'SAMSARA_API_KEY'] as const;

type SettingsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const apiKeys = useMemo(() => keyNames.map((keyName) => rotateAPIKey(keyName)), []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>API Key Management</Text>
          {apiKeys.map((item) => (
            <View key={item.keyName} style={styles.row}>
              <View>
                <Text style={styles.label}>{item.keyName}</Text>
                <Text style={styles.helper}>Next rotation: {new Date(item.nextRotationDate).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.keyPreview}>{item.newKey.slice(0, 10)}...</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Subscription Tier</Text>
          <Text style={styles.label}>Fleet • 10 AI workers unlocked</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Subscription')}>
            <Text style={styles.primaryButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.title}>Notification Preferences</Text>
              <Text style={styles.helper}>Enable operational alerts and broker updates</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={notificationsEnabled ? PHI_COLORS.sunshineYellow : '#B0B0B0'}
              trackColor={{ false: '#5C6780', true: '#7EA5FF' }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 18, padding: 18, gap: 14 },
  title: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: PHI_COLORS.white, fontWeight: '700' },
  helper: { color: '#D7E3FF', marginTop: 4, maxWidth: 220 },
  keyPreview: { color: PHI_COLORS.sunshineYellow, fontWeight: '700' },
  primaryButton: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 14, padding: 14 },
  primaryButtonText: { color: PHI_COLORS.white, textAlign: 'center', fontWeight: '800' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
