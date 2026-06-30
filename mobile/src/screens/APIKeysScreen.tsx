// Customers enter their own API keys here — PHI uses their accounts so usage
// hits their free tiers, not PHI's. Keys are stored encrypted on-device via expo-secure-store.

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import useAPIKeyStore, { CustomerAPIKeys } from '../store/apiKeyStore';

interface KeyField {
  field: keyof CustomerAPIKeys;
  label: string;
  placeholder: string;
  helpText: string;
  signupUrl: string;
  required: boolean;
}

const KEY_FIELDS: KeyField[] = [
  {
    field: 'anthropicKey',
    label: 'Claude AI (Anthropic)',
    placeholder: 'sk-ant-api03-...',
    helpText: 'Powers all 10 AI workers. Free $5 credit on signup.',
    signupUrl: 'console.anthropic.com',
    required: true,
  },
  {
    field: 'orsKey',
    label: 'OpenRouteService (Routing)',
    placeholder: 'eyJ0eXAiOiJKV...',
    helpText: 'Free truck routing: 2,000 requests/day.',
    signupUrl: 'openrouteservice.org/dev',
    required: false,
  },
  {
    field: 'eiaKey',
    label: 'EIA Open Data (Fuel Prices)',
    placeholder: 'abc123def...',
    helpText: 'Free US government diesel price data.',
    signupUrl: 'eia.gov/opendata/register.php',
    required: false,
  },
  {
    field: 'stripeKey',
    label: 'Stripe (Payments)',
    placeholder: 'pk_test_... or pk_live_...',
    helpText: 'For subscription billing. Test mode is free.',
    signupUrl: 'stripe.com',
    required: false,
  },
  {
    field: 'datApiKey',
    label: 'DAT Load Board API',
    placeholder: 'dat_api_key_...',
    helpText: 'Your DAT Trucker credentials for live loads.',
    signupUrl: 'dat.com/trucking',
    required: false,
  },
];

export default function APIKeysScreen() {
  const { keys, loaded, loadKeys, saveKey, clearAllKeys } = useAPIKeyStore();
  const [values, setValues] = useState<CustomerAPIKeys>(keys);
  const [saving, setSaving] = useState<Partial<Record<keyof CustomerAPIKeys, boolean>>>({});
  const [visible, setVisible] = useState<Partial<Record<keyof CustomerAPIKeys, boolean>>>({});

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  useEffect(() => {
    setValues(keys);
  }, [keys]);

  const handleSave = async (field: keyof CustomerAPIKeys): Promise<void> => {
    setSaving((s) => ({ ...s, [field]: true }));
    await saveKey(field, values[field]);
    setSaving((s) => ({ ...s, [field]: false }));
    Alert.alert('Saved', 'API key saved securely on your device.');
  };

  const handleClearAll = (): void => {
    Alert.alert(
      'Clear All Keys',
      'This removes all stored API keys from your device. PHI will fall back to free shared tiers.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => void clearAllKeys() },
      ],
    );
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={PHI_COLORS.sunshineYellow} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>

          <View style={styles.infoCard}>
            <Ionicons name="key-outline" size={28} color={PHI_COLORS.sunshineYellow} />
            <Text style={styles.infoTitle}>Bring Your Own API Keys</Text>
            <Text style={styles.infoText}>
              Enter your own free API keys below. PHI uses your accounts so you stay on free tiers.
              Keys are stored encrypted on your device — never sent to PHI servers.
            </Text>
          </View>

          {KEY_FIELDS.map((kf) => {
            const isVisible = visible[kf.field];
            const isSaving = saving[kf.field];
            const hasValue = Boolean(values[kf.field]);

            return (
              <View key={kf.field} style={[styles.keyCard, hasValue && styles.keyCardActive]}>
                <View style={styles.keyHeader}>
                  <Text style={styles.keyLabel}>{kf.label}</Text>
                  {kf.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>REQUIRED</Text>
                    </View>
                  )}
                  {hasValue && <Ionicons name="checkmark-circle" size={18} color={PHI_COLORS.moneyGreen} />}
                </View>

                <Text style={styles.helpText}>{kf.helpText}</Text>
                <Text style={styles.signupText}>📎 Free signup: {kf.signupUrl}</Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={values[kf.field]}
                    onChangeText={(t) => setValues((v) => ({ ...v, [kf.field]: t }))}
                    placeholder={kf.placeholder}
                    placeholderTextColor="#7F8FB3"
                    secureTextEntry={!isVisible}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setVisible((v) => ({ ...v, [kf.field]: !isVisible }))}
                  >
                    <Ionicons
                      name={isVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#7F8FB3"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={() => void handleSave(kf.field)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={PHI_COLORS.charcoalBlack} size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Key</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={18} color="#FF5252" />
            <Text style={styles.clearButtonText}>Clear All Saved Keys</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
  infoCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 18, padding: 18, gap: 10, alignItems: 'center' },
  infoTitle: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '800' },
  infoText: { color: '#D7E3FF', lineHeight: 20, textAlign: 'center' },
  keyCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#21406F' },
  keyCardActive: { borderColor: PHI_COLORS.moneyGreen + '66' },
  keyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keyLabel: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 15, flex: 1 },
  requiredBadge: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  requiredText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 9 },
  helpText: { color: '#A8B7D8', fontSize: 12 },
  signupText: { color: PHI_COLORS.sunshineYellow, fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#29508C', fontSize: 13 },
  eyeButton: { padding: 12 },
  saveButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, padding: 12, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800' },
  clearButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#FF525244' },
  clearButtonText: { color: '#FF5252', fontWeight: '700' },
});
