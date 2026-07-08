// Free-tier customers enter their own API keys here — PHI uses their accounts so usage
// hits their free tiers, not PHI's. Keys are stored encrypted on-device via expo-secure-store.
// Paid tiers (Solo/Fleet/Enterprise) get AI managed automatically — see hasManagedAI().

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import useAPIKeyStore, { AIProvider, CustomerAPIKeys } from '../store/apiKeyStore';
import usePromoStore from '../store/promoStore';
import { hasManagedAI } from '../utils/subscriptionGating';
import { RootStackParamList } from '../navigation/RootNavigator';

type APIKeysNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface KeyField {
  field: keyof CustomerAPIKeys;
  label: string;
  placeholder: string;
  helpText: string;
  signupUrl: string;
  required: boolean;
  provider?: AIProvider;
}

const KEY_FIELDS: KeyField[] = [
  {
    field: 'anthropicKey',
    label: 'Claude (Anthropic)',
    placeholder: 'sk-ant-api03-...',
    helpText: 'Powers all 10 AI workers. Free $5 credit on signup.',
    signupUrl: 'console.anthropic.com',
    required: false,
    provider: 'anthropic',
  },
  {
    field: 'kimiKey',
    label: 'Kimi (Moonshot AI)',
    placeholder: 'sk-...',
    helpText: 'Alternate AI provider that also powers all 10 AI workers. Free credits on signup.',
    signupUrl: 'platform.moonshot.ai',
    required: false,
    provider: 'kimi',
  },
  {
    field: 'huggingfaceKey',
    label: 'Hugging Face (Open Model)',
    placeholder: 'hf_...',
    helpText: 'Completely free, open-weight AI model. Lower rate limits than Claude or Kimi — a good backup, not your only key.',
    signupUrl: 'huggingface.co/settings/tokens',
    required: false,
    provider: 'huggingface',
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
];

export default function APIKeysScreen() {
  const navigation = useNavigation<APIKeysNavigationProp>();
  const { keys, preferredProvider, loaded, loadKeys, saveKey, setPreferredProvider, clearAllKeys } = useAPIKeyStore();
  const { getEffectiveTier } = usePromoStore();
  const [values, setValues] = useState<CustomerAPIKeys>(keys);
  const [saving, setSaving] = useState<Partial<Record<keyof CustomerAPIKeys, boolean>>>({});
  const [visible, setVisible] = useState<Partial<Record<keyof CustomerAPIKeys, boolean>>>({});

  const tier = getEffectiveTier();
  const managed = hasManagedAI(tier);

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

          {managed ? (
            <View style={styles.managedCard}>
              <Ionicons name="shield-checkmark-outline" size={28} color={PHI_COLORS.moneyGreen} />
              <Text style={styles.managedTitle}>AI Is Managed on Your {tier} Plan</Text>
              <Text style={styles.managedText}>
                Your subscription includes AI — PHI runs it for you at no extra setup. You don't need a
                key below. Routing and fuel-price keys are still optional if you want to use your own quota.
              </Text>
            </View>
          ) : (
            <View style={styles.infoCard}>
              <Ionicons name="alert-circle-outline" size={28} color={PHI_COLORS.sunshineYellow} />
              <Text style={styles.infoTitle}>PHI Is Free — With One Catch</Text>
              <Text style={styles.infoText}>
                On the Free plan, AI features run on your own free API key — pick Claude, Kimi, or Hugging Face
                below (about 2 minutes to set up, no credit card). Keys are stored encrypted on your device — never
                sent to PHI servers.
              </Text>
              <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate('Subscription')}>
                <Text style={styles.upgradeButtonText}>Or upgrade and skip setup — we'll run AI for you →</Text>
              </TouchableOpacity>
            </View>
          )}

          {!managed && (
            <View style={styles.providerCard}>
              <Text style={styles.providerTitle}>Preferred AI Provider</Text>
              <Text style={styles.helpText}>Which key PHI uses first if you've set up more than one.</Text>
              <View style={styles.providerRow}>
                {(['anthropic', 'kimi', 'huggingface'] as AIProvider[]).map((provider) => (
                  <TouchableOpacity
                    key={provider}
                    style={[styles.providerButton, preferredProvider === provider && styles.providerButtonActive]}
                    onPress={() => void setPreferredProvider(provider)}
                  >
                    <Text style={[styles.providerButtonText, preferredProvider === provider && styles.providerButtonTextActive]}>
                      {provider === 'anthropic' ? 'Claude' : provider === 'kimi' ? 'Kimi' : 'Hugging Face'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {KEY_FIELDS.map((kf) => {
            const isVisible = visible[kf.field];
            const isSaving = saving[kf.field];
            const hasValue = Boolean(values[kf.field]);
            const skippable = managed && Boolean(kf.provider);

            return (
              <View key={kf.field} style={[styles.keyCard, hasValue && styles.keyCardActive]}>
                <View style={styles.keyHeader}>
                  <Text style={styles.keyLabel}>{kf.label}</Text>
                  {kf.required && !skippable && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredText}>REQUIRED</Text>
                    </View>
                  )}
                  {skippable && (
                    <View style={styles.coveredBadge}>
                      <Text style={styles.coveredText}>COVERED BY PLAN</Text>
                    </View>
                  )}
                  {hasValue && <Ionicons name="checkmark-circle" size={18} color={PHI_COLORS.moneyGreen} />}
                </View>

                <Text style={styles.helpText}>{skippable ? 'Optional — only fill in if you prefer your own quota over PHI-managed AI.' : kf.helpText}</Text>
                <TouchableOpacity onPress={() => void Linking.openURL(`https://${kf.signupUrl}`)}>
                  <Text style={styles.signupText}>📎 Free signup: {kf.signupUrl}</Text>
                </TouchableOpacity>

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
  upgradeButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
  upgradeButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 12, textAlign: 'center' },
  managedCard: { backgroundColor: '#0F3D2E', borderRadius: 18, padding: 18, gap: 10, alignItems: 'center', borderWidth: 1, borderColor: PHI_COLORS.moneyGreen + '66' },
  managedTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  managedText: { color: '#CFEAD9', lineHeight: 20, textAlign: 'center' },
  providerCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: '#21406F' },
  providerTitle: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 15 },
  providerRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  providerButton: { flex: 1, backgroundColor: '#132B52', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#29508C' },
  providerButtonActive: { backgroundColor: PHI_COLORS.sunshineYellow, borderColor: PHI_COLORS.sunshineYellow },
  providerButtonText: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 13 },
  providerButtonTextActive: { color: PHI_COLORS.charcoalBlack },
  keyCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#21406F' },
  keyCardActive: { borderColor: PHI_COLORS.moneyGreen + '66' },
  keyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keyLabel: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 15, flex: 1 },
  requiredBadge: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  requiredText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 9 },
  coveredBadge: { backgroundColor: PHI_COLORS.moneyGreen, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  coveredText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 9 },
  helpText: { color: '#A8B7D8', fontSize: 12 },
  signupText: { color: PHI_COLORS.sunshineYellow, fontSize: 12, textDecorationLine: 'underline' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#29508C', fontSize: 13 },
  eyeButton: { padding: 12 },
  saveButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, padding: 12, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800' },
  clearButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#FF525244' },
  clearButtonText: { color: '#FF5252', fontWeight: '700' },
});
