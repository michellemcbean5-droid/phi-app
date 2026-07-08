import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import usePayoutStore, { PayoutMethod } from '../store/payoutStore';

const METHODS: { value: PayoutMethod; label: string }[] = [
  { value: 'direct_deposit', label: 'Direct Deposit' },
  { value: 'factoring_company', label: 'Factoring Company' },
  { value: 'check', label: 'Paper Check' },
];

export default function PayoutSettingsScreen() {
  const { prefs, loaded, loadPrefs, setField, isConfigured } = usePayoutStore();
  const [saving, setSaving] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    setSaving(false);
    Alert.alert('Saved', 'Payout preferences saved securely on your device.');
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={PHI_COLORS.sunshineYellow} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>

          <View style={styles.noticeCard}>
            <Ionicons name="construct-outline" size={26} color={PHI_COLORS.sunshineYellow} />
            <Text style={styles.noticeTitle}>Setup Only — Not Live Yet</Text>
            <Text style={styles.noticeText}>
              PHI doesn't move money yet. This screen saves your payout preferences securely on your device so
              they're ready the moment a payment processor is connected — nothing here is transmitted anywhere
              or charges/pays anyone today.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>How You Get Paid</Text>
            <View style={styles.methodRow}>
              {METHODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.methodChip, prefs.method === m.value && styles.methodChipActive]}
                  onPress={() => void setField('method', m.value)}
                >
                  <Text style={[styles.methodChipText, prefs.method === m.value && styles.methodChipTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {prefs.method === 'factoring_company' ? (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Factoring Company Name</Text>
              <TextInput
                style={styles.input}
                value={prefs.factoringCompanyName}
                onChangeText={(t) => void setField('factoringCompanyName', t)}
                placeholder="e.g. Apex Capital"
                placeholderTextColor="#7F8FB3"
              />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{prefs.method === 'check' ? 'Mailing Details' : 'Bank Account'}</Text>

              <Text style={styles.fieldLabel}>Account Holder Name</Text>
              <TextInput
                style={styles.input}
                value={prefs.accountHolderName}
                onChangeText={(t) => void setField('accountHolderName', t)}
                placeholder="Name on the account"
                placeholderTextColor="#7F8FB3"
                autoCapitalize="words"
              />

              {prefs.method === 'direct_deposit' && (
                <>
                  <Text style={styles.fieldLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    value={prefs.bankName}
                    onChangeText={(t) => void setField('bankName', t)}
                    placeholder="e.g. Chase"
                    placeholderTextColor="#7F8FB3"
                  />

                  <Text style={styles.fieldLabel}>Routing Number</Text>
                  <TextInput
                    style={styles.input}
                    value={prefs.routingNumber}
                    onChangeText={(t) => void setField('routingNumber', t.replace(/[^0-9]/g, '').slice(0, 9))}
                    placeholder="9 digits"
                    placeholderTextColor="#7F8FB3"
                    keyboardType="numeric"
                    secureTextEntry={!showAccountNumber}
                  />

                  <View style={styles.accountRow}>
                    <Text style={styles.fieldLabel}>Account Number</Text>
                    <TouchableOpacity onPress={() => setShowAccountNumber((v) => !v)}>
                      <Ionicons name={showAccountNumber ? 'eye-off-outline' : 'eye-outline'} size={18} color="#7F8FB3" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={prefs.accountNumber}
                    onChangeText={(t) => void setField('accountNumber', t.replace(/[^0-9]/g, ''))}
                    placeholder="Account number"
                    placeholderTextColor="#7F8FB3"
                    keyboardType="numeric"
                    secureTextEntry={!showAccountNumber}
                  />
                </>
              )}
            </View>
          )}

          <View style={[styles.statusCard, isConfigured() && styles.statusCardOk]}>
            <Ionicons
              name={isConfigured() ? 'checkmark-circle' : 'alert-circle-outline'}
              size={20}
              color={isConfigured() ? PHI_COLORS.moneyGreen : PHI_COLORS.sunshineYellow}
            />
            <Text style={styles.statusText}>
              {isConfigured() ? 'Payout preferences complete.' : 'Fill in the details above to complete setup.'}
            </Text>
          </View>

          <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={() => void handleSave()} disabled={saving}>
            {saving ? <ActivityIndicator color={PHI_COLORS.charcoalBlack} /> : <Text style={styles.saveButtonText}>Save Payout Preferences</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 16 },
  noticeCard: { backgroundColor: '#3D2A0F', borderRadius: 18, padding: 18, gap: 10, alignItems: 'center', borderWidth: 1, borderColor: PHI_COLORS.sunshineYellow + '66' },
  noticeTitle: { color: PHI_COLORS.white, fontSize: 17, fontWeight: '800' },
  noticeText: { color: '#F0DCB0', lineHeight: 20, textAlign: 'center' },
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10 },
  cardTitle: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 15 },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodChip: { backgroundColor: '#132B52', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#29508C' },
  methodChipActive: { backgroundColor: PHI_COLORS.sunshineYellow, borderColor: PHI_COLORS.sunshineYellow },
  methodChipText: { color: '#D7E3FF', fontSize: 13, fontWeight: '700' },
  methodChipTextActive: { color: PHI_COLORS.charcoalBlack },
  fieldLabel: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 13 },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#29508C' },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#3D2A0F', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: PHI_COLORS.sunshineYellow + '66' },
  statusCardOk: { backgroundColor: '#0F3D2E', borderColor: PHI_COLORS.moneyGreen + '66' },
  statusText: { flex: 1, flexShrink: 1, color: PHI_COLORS.white, fontSize: 13, fontWeight: '600' },
  saveButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 15 },
});
