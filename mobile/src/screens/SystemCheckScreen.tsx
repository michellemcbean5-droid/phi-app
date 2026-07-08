// Troubleshoot / system check — a real, running checklist (not a static FAQ) that
// verifies the things that actually make PHI work: AI access, permissions, and the
// profile/vehicle/document data other screens depend on.

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import { isClaudeConfigured } from '../api/claudeClient';
import useProfileStore from '../store/profileStore';
import useVehicleStore from '../store/vehicleStore';
import useDocumentsStore from '../store/documentsStore';
import usePromoStore from '../store/promoStore';
import { hasManagedAI } from '../utils/subscriptionGating';

type SystemCheckNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type CheckStatus = 'pass' | 'warn' | 'fail';

interface CheckItem {
  id: string;
  label: string;
  detail: string;
  status: CheckStatus;
  fixLabel?: string;
  onFix?: () => void;
}

const STATUS_META: Record<CheckStatus, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  pass: { icon: 'checkmark-circle', color: PHI_COLORS.moneyGreen },
  warn: { icon: 'alert-circle', color: PHI_COLORS.sunshineYellow },
  fail: { icon: 'close-circle', color: '#FF5252' },
};

export default function SystemCheckScreen() {
  const navigation = useNavigation<SystemCheckNavigationProp>();
  const { isComplete: profileComplete } = useProfileStore();
  const { vehicles } = useVehicleStore();
  const { documents } = useDocumentsStore();
  const { getEffectiveTier } = usePromoStore();
  const [checks, setChecks] = useState<CheckItem[] | null>(null);
  const [running, setRunning] = useState(false);

  const runChecks = useCallback(async (): Promise<void> => {
    setRunning(true);
    const tier = getEffectiveTier();
    const managed = hasManagedAI(tier);
    const aiOk = isClaudeConfigured();
    const locationStatus = await Location.getForegroundPermissionsAsync();
    const notificationStatus = await Notifications.getPermissionsAsync();
    const vehicleReady = vehicles.some((v) => v.make.trim() && v.mileage.trim());

    const results: CheckItem[] = [
      {
        id: 'ai',
        label: 'AI Access',
        detail: aiOk
          ? managed
            ? 'Managed AI is active on your plan.'
            : 'Your own API key is set and working.'
          : managed
            ? 'Your plan includes managed AI, but the backend proxy isn\'t configured yet — add your own key as a workaround.'
            : 'No API key set — AI workers are running on simpler built-in logic.',
        status: aiOk ? 'pass' : 'warn',
        fixLabel: aiOk ? undefined : 'Add API Key',
        onFix: () => navigation.navigate('APIKeys'),
      },
      {
        id: 'profile',
        label: 'Driver Identity',
        detail: profileComplete()
          ? 'Name and CDL info are on file.'
          : 'Missing name or CDL info — brokers may ask for this.',
        status: profileComplete() ? 'pass' : 'fail',
        fixLabel: profileComplete() ? undefined : 'Complete Profile',
        onFix: () => navigation.navigate('Main'),
      },
      {
        id: 'location',
        label: 'Location Access',
        detail: locationStatus.granted
          ? 'Granted — deadhead miles and nearby loads work correctly.'
          : 'Not granted — route and load-proximity features will use less accurate estimates.',
        status: locationStatus.granted ? 'pass' : 'warn',
      },
      {
        id: 'notifications',
        label: 'Push Notifications',
        detail: notificationStatus.granted
          ? 'Granted — you\'ll get alerts for bookings and compliance warnings.'
          : 'Not granted — you may miss time-sensitive alerts.',
        status: notificationStatus.granted ? 'pass' : 'warn',
      },
      {
        id: 'vehicle',
        label: 'Vehicle Profile',
        detail: vehicleReady
          ? 'At least one vehicle has make/model and mileage on file.'
          : 'Add your truck\'s make, model, and mileage to unlock maintenance suggestions.',
        status: vehicleReady ? 'pass' : 'warn',
        fixLabel: vehicleReady ? undefined : 'Set Up Vehicle',
        onFix: () => navigation.navigate('Vehicle'),
      },
      {
        id: 'documents',
        label: 'Document Storage',
        detail: documents.length > 0
          ? `${documents.length} document${documents.length === 1 ? '' : 's'} on file.`
          : 'No documents uploaded yet — scan your BOL, insurance, or registration.',
        status: documents.length > 0 ? 'pass' : 'warn',
        fixLabel: documents.length > 0 ? undefined : 'Upload Documents',
        onFix: () => navigation.navigate('Documents'),
      },
    ];

    setChecks(results);
    setRunning(false);
  }, [documents.length, getEffectiveTier, navigation, profileComplete, vehicles]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  const failing = checks?.filter((c) => c.status !== 'pass') ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Ionicons name="build-outline" size={28} color={PHI_COLORS.sunshineYellow} />
          <Text style={styles.heroTitle}>System Check</Text>
          <Text style={styles.heroText}>
            A live checklist of everything PHI needs to work correctly — not a canned FAQ.
          </Text>
          <TouchableOpacity style={styles.rerunButton} onPress={() => void runChecks()} disabled={running}>
            {running ? (
              <ActivityIndicator color={PHI_COLORS.charcoalBlack} size="small" />
            ) : (
              <Text style={styles.rerunButtonText}>Re-run Check</Text>
            )}
          </TouchableOpacity>
        </View>

        {checks === null ? (
          <View style={styles.center}>
            <ActivityIndicator color={PHI_COLORS.sunshineYellow} size="large" />
          </View>
        ) : (
          <>
            <View style={[styles.summaryCard, failing.length === 0 && styles.summaryCardOk]}>
              <Text style={styles.summaryText}>
                {failing.length === 0
                  ? 'Everything checks out — PHI is fully set up.'
                  : `${failing.length} item${failing.length === 1 ? '' : 's'} to fix below.`}
              </Text>
            </View>

            {checks.map((check) => {
              const meta = STATUS_META[check.status];
              return (
                <View key={check.id} style={styles.checkCard}>
                  <Ionicons name={meta.icon} size={22} color={meta.color} />
                  <View style={styles.checkTextWrap}>
                    <Text style={styles.checkLabel}>{check.label}</Text>
                    <Text style={styles.checkDetail}>{check.detail}</Text>
                  </View>
                  {check.onFix && check.fixLabel && (
                    <TouchableOpacity style={styles.fixButton} onPress={check.onFix}>
                      <Text style={styles.fixButtonText}>{check.fixLabel}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 14 },
  heroCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 18, padding: 18, alignItems: 'center', gap: 10 },
  heroTitle: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '900' },
  heroText: { color: '#D7E3FF', lineHeight: 20, textAlign: 'center' },
  rerunButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, minWidth: 130, alignItems: 'center' },
  rerunButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800' },
  center: { paddingVertical: 40, alignItems: 'center' },
  summaryCard: { backgroundColor: '#3D2A0F', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: PHI_COLORS.sunshineYellow + '66' },
  summaryCardOk: { backgroundColor: '#0F3D2E', borderColor: PHI_COLORS.moneyGreen + '66' },
  summaryText: { color: PHI_COLORS.white, fontWeight: '700', textAlign: 'center' },
  checkCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 14 },
  checkTextWrap: { flex: 1, flexShrink: 1 },
  checkLabel: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 14 },
  checkDetail: { color: '#A8B7D8', fontSize: 12, marginTop: 2, lineHeight: 16 },
  fixButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  fixButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 11 },
});
