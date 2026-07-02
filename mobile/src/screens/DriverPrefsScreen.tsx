// AI Dispatcher Preferences — set these once and the 10 AI workers run autonomously.
// The AI reads these prefs to find, score, negotiate, and book loads for you.

import React from 'react';
import {
  ScrollView, StyleSheet, Switch, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import useDriverPrefsStore, { EquipmentPref } from '../store/driverPrefsStore';
import { RootStackParamList } from '../navigation/RootNavigator';

type DriverPrefsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const EQUIPMENT_OPTIONS: EquipmentPref[] = ['Dry Van', 'Reefer', 'Flatbed', 'Any'];

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export default function DriverPrefsScreen() {
  const navigation = useNavigation<DriverPrefsNavigationProp>();
  const { prefs, updatePref, resetPrefs } = useDriverPrefsStore();

  const toggleState = (state: string, list: 'preferredStates' | 'avoidStates') => {
    const current = prefs[list];
    const updated = current.includes(state)
      ? current.filter((s) => s !== state)
      : [...current, state];
    updatePref(list, updated);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Ionicons name="hardware-chip-outline" size={28} color={PHI_COLORS.sunshineYellow} />
          <Text style={styles.heroTitle}>AI Dispatcher Settings</Text>
          <Text style={styles.heroText}>
            Set your preferences once. PHI's 10 AI workers find loads, negotiate rates,
            and book freight automatically — you just drive.
          </Text>
        </View>

        {/* Home Base */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🏠 Home Base</Text>
          <Text style={styles.fieldLabel}>City</Text>
          <TextInput
            style={styles.input}
            value={prefs.homeCity}
            onChangeText={(v) => updatePref('homeCity', v)}
            placeholder="Fort Worth"
            placeholderTextColor="#7F8FB3"
          />
          <Text style={styles.fieldLabel}>State</Text>
          <TextInput
            style={styles.input}
            value={prefs.homeState}
            onChangeText={(v) => updatePref('homeState', v.toUpperCase().slice(0, 2))}
            placeholder="TX"
            placeholderTextColor="#7F8FB3"
            maxLength={2}
            autoCapitalize="characters"
          />
        </View>

        {/* Equipment */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🚛 Equipment Type</Text>
          <View style={styles.chipRow}>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <TouchableOpacity
                key={eq}
                style={[styles.chip, prefs.equipmentType === eq && styles.chipActive]}
                onPress={() => updatePref('equipmentType', eq)}
              >
                <Text style={[styles.chipText, prefs.equipmentType === eq && styles.chipTextActive]}>{eq}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rate Thresholds */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>💰 Rate Thresholds</Text>

          <Text style={styles.fieldLabel}>Minimum RPM (AI won't book below this)</Text>
          <View style={styles.rpmRow}>
            {[2.00, 2.50, 2.75, 3.00, 3.25, 3.50].map((rpm) => (
              <TouchableOpacity
                key={rpm}
                style={[styles.chip, prefs.minRPM === rpm && styles.chipActive]}
                onPress={() => updatePref('minRPM', rpm)}
              >
                <Text style={[styles.chipText, prefs.minRPM === rpm && styles.chipTextActive]}>${rpm.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Auto-Book RPM Trigger (AI books automatically above this)</Text>
          <View style={styles.rpmRow}>
            {[2.75, 3.00, 3.25, 3.50, 3.75, 4.00].map((rpm) => (
              <TouchableOpacity
                key={rpm}
                style={[styles.chip, prefs.autoBookMinRPM === rpm && styles.chipActive]}
                onPress={() => updatePref('autoBookMinRPM', rpm)}
              >
                <Text style={[styles.chipText, prefs.autoBookMinRPM === rpm && styles.chipTextActive]}>${rpm.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Min Broker Rating</Text>
          <View style={styles.rpmRow}>
            {[3.5, 4.0, 4.2, 4.5, 4.8].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[styles.chip, prefs.minBrokerRating === rating && styles.chipActive]}
                onPress={() => updatePref('minBrokerRating', rating)}
              >
                <Text style={[styles.chipText, prefs.minBrokerRating === rating && styles.chipTextActive]}>{rating}★</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trip Range */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📏 Trip Range</Text>
          <Text style={styles.fieldLabel}>Min Miles</Text>
          <TextInput
            style={styles.input}
            value={String(prefs.minTripMiles)}
            onChangeText={(v) => updatePref('minTripMiles', Number(v) || 200)}
            keyboardType="numeric"
            placeholder="200"
            placeholderTextColor="#7F8FB3"
          />
          <Text style={styles.fieldLabel}>Max Miles</Text>
          <TextInput
            style={styles.input}
            value={String(prefs.maxTripMiles)}
            onChangeText={(v) => updatePref('maxTripMiles', Number(v) || 1200)}
            keyboardType="numeric"
            placeholder="1200"
            placeholderTextColor="#7F8FB3"
          />
          <Text style={styles.fieldLabel}>Max Deadhead Miles</Text>
          <TextInput
            style={styles.input}
            value={String(prefs.maxDeadheadMiles)}
            onChangeText={(v) => updatePref('maxDeadheadMiles', Number(v) || 100)}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor="#7F8FB3"
          />
        </View>

        {/* Auto-Book Toggle */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>🤖 Auto-Book Mode</Text>
              <Text style={styles.helpText}>
                When ON, the AI automatically books loads above your RPM trigger
                without asking. When OFF, it presents the load for your approval.
              </Text>
            </View>
            <Switch
              value={prefs.autoBookEnabled}
              onValueChange={(v) => updatePref('autoBookEnabled', v)}
              thumbColor={prefs.autoBookEnabled ? PHI_COLORS.sunshineYellow : '#B0B0B0'}
              trackColor={{ false: '#5C6780', true: '#7EA5FF' }}
            />
          </View>
        </View>

        {/* Preferred States */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>✅ Preferred States</Text>
          <Text style={styles.helpText}>AI prioritizes loads in these states.</Text>
          <View style={styles.stateGrid}>
            {US_STATES.map((state) => {
              const preferred = prefs.preferredStates.includes(state);
              const avoided = prefs.avoidStates.includes(state);
              return (
                <TouchableOpacity
                  key={state}
                  style={[
                    styles.stateChip,
                    preferred && styles.stateChipPreferred,
                    avoided && styles.stateChipAvoided,
                  ]}
                  onPress={() => {
                    if (avoided) { toggleState(state, 'avoidStates'); return; }
                    toggleState(state, 'preferredStates');
                  }}
                >
                  <Text style={[
                    styles.stateText,
                    (preferred || avoided) && styles.stateTextActive,
                  ]}>{state}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* HOS Warning */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>⚠️ HOS Warning Threshold</Text>
          <Text style={styles.helpText}>Alert me when drive hours drop below:</Text>
          <View style={styles.rpmRow}>
            {[1, 2, 3, 4].map((h) => (
              <TouchableOpacity
                key={h}
                style={[styles.chip, prefs.hosWarningThresholdHours === h && styles.chipActive]}
                onPress={() => updatePref('hosWarningThresholdHours', h)}
              >
                <Text style={[styles.chipText, prefs.hosWarningThresholdHours === h && styles.chipTextActive]}>{h} hr</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.continueText}>Continue to Dashboard →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetPrefs}>
          <Text style={styles.resetText}>Reset to PHI Defaults</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
  heroCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 18, padding: 18, alignItems: 'center', gap: 10 },
  heroTitle: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '900' },
  heroText: { color: '#D7E3FF', lineHeight: 20, textAlign: 'center' },
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { color: PHI_COLORS.white, fontSize: 16, fontWeight: '800' },
  fieldLabel: { color: '#A8B7D8', fontSize: 12, fontWeight: '700' },
  helpText: { color: '#A8B7D8', fontSize: 12, lineHeight: 18 },
  input: { backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#29508C' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rpmRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#132B52', borderWidth: 1, borderColor: '#29508C' },
  chipActive: { backgroundColor: PHI_COLORS.sunshineYellow, borderColor: PHI_COLORS.sunshineYellow },
  chipText: { color: '#D7E3FF', fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: PHI_COLORS.charcoalBlack },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stateChip: { width: 42, alignItems: 'center', paddingVertical: 7, borderRadius: 8, backgroundColor: '#132B52', borderWidth: 1, borderColor: '#29508C' },
  stateChipPreferred: { backgroundColor: PHI_COLORS.moneyGreen + '33', borderColor: PHI_COLORS.moneyGreen },
  stateChipAvoided: { backgroundColor: '#FF525233', borderColor: '#FF5252' },
  stateText: { color: '#D7E3FF', fontWeight: '700', fontSize: 11 },
  stateTextActive: { color: PHI_COLORS.white },
  continueButton: { backgroundColor: PHI_COLORS.moneyGreen, borderRadius: 14, padding: 16 },
  continueText: { color: PHI_COLORS.charcoalBlack, textAlign: 'center', fontWeight: '900', fontSize: 16 },
  resetButton: { borderWidth: 1, borderColor: '#29508C', borderRadius: 14, padding: 14 },
  resetText: { color: '#A8B7D8', textAlign: 'center', fontWeight: '700' },
});
