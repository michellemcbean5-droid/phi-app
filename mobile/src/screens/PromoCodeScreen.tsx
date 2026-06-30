import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import usePromoStore from '../store/promoStore';
import { getWorkerLimit } from '../utils/subscriptionGating';

const HINT_CODES = [
  { code: 'PHIFREE30', benefit: '30-day Enterprise — all 15 workers' },
  { code: 'OWNER1TRUCK', benefit: '14-day Solo — 5 workers' },
  { code: 'PHIVIP', benefit: '60-day VIP Enterprise' },
];

export default function PromoCodeScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { applyPromoCode, activeTier, paymentStatus, daysRemaining, isTrialActive } = usePromoStore();

  const handleRedeem = async (): Promise<void> => {
    if (!input.trim()) {
      Alert.alert('Enter a code', 'Type your promo code above.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = applyPromoCode(input);
    setLoading(false);

    if ('error' in result) {
      Alert.alert('Invalid Code', result.error);
    } else {
      setInput('');
      Alert.alert('🎉 Code Activated!', result.message, [{ text: 'Let\'s Roll!' }]);
    }
  };

  const workerLimit = getWorkerLimit(activeTier);
  const trialActive = isTrialActive();
  const days = daysRemaining();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Current Status */}
          <View style={styles.statusCard}>
            <Ionicons name="ribbon-outline" size={32} color={PHI_COLORS.sunshineYellow} />
            <Text style={styles.statusTier}>{activeTier} Plan</Text>
            <Text style={styles.statusWorkers}>{workerLimit} AI Workers Unlocked</Text>
            {trialActive && (
              <View style={styles.trialChip}>
                <Text style={styles.trialChipText}>🎁 Free Trial — {days} days remaining</Text>
              </View>
            )}
            {paymentStatus === 'none' && (
              <Text style={styles.statusSub}>No active subscription. Enter a code or subscribe below.</Text>
            )}
          </View>

          {/* Code Entry */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Enter Promo Code</Text>
            <TextInput
              style={styles.codeInput}
              value={input}
              onChangeText={(t) => setInput(t.toUpperCase())}
              placeholder="e.g. PHIFREE30"
              placeholderTextColor="#7F8FB3"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.redeemButton, loading && styles.redeemButtonDisabled]}
              onPress={() => void handleRedeem()}
              disabled={loading}
            >
              <Text style={styles.redeemButtonText}>
                {loading ? 'Checking...' : 'Redeem Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Available Codes */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Available Promo Codes</Text>
            <Text style={styles.hintNote}>Share these with friends or use one yourself:</Text>
            {HINT_CODES.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={styles.hintRow}
                onPress={() => setInput(item.code)}
              >
                <View>
                  <Text style={styles.hintCode}>{item.code}</Text>
                  <Text style={styles.hintBenefit}>{item.benefit}</Text>
                </View>
                <Ionicons name="copy-outline" size={18} color={PHI_COLORS.sunshineYellow} />
              </TouchableOpacity>
            ))}
          </View>

          {/* What You Get */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What the Free Trial Includes</Text>
            {[
              'All AI workers active immediately',
              'Auto load discovery (DAT + Truckstop style)',
              'AI negotiation emails sent to brokers',
              'Live HOS compliance monitoring',
              'Revenue & profit analytics',
              'No credit card required to activate',
              'Cancel or upgrade anytime',
            ].map((feat) => (
              <Text key={feat} style={styles.featureRow}>✅  {feat}</Text>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
  statusCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8 },
  statusTier: { color: PHI_COLORS.white, fontSize: 26, fontWeight: '900', marginTop: 8 },
  statusWorkers: { color: '#D7E3FF' },
  trialChip: { backgroundColor: PHI_COLORS.moneyGreen, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6, marginTop: 4 },
  trialChipText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 13 },
  statusSub: { color: '#A8B7D8', fontSize: 12, textAlign: 'center', marginTop: 4 },
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 18, padding: 18, gap: 12 },
  sectionTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800' },
  hintNote: { color: '#A8B7D8', fontSize: 12 },
  codeInput: {
    backgroundColor: '#132B52',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: PHI_COLORS.sunshineYellow,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    borderWidth: 2,
    borderColor: '#29508C',
    textAlign: 'center',
  },
  redeemButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 14, padding: 16 },
  redeemButtonDisabled: { opacity: 0.6 },
  redeemButtonText: { color: PHI_COLORS.charcoalBlack, textAlign: 'center', fontWeight: '900', fontSize: 16 },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#21406F' },
  hintCode: { color: PHI_COLORS.sunshineYellow, fontWeight: '800', fontSize: 15 },
  hintBenefit: { color: '#D7E3FF', fontSize: 12, marginTop: 2 },
  featureRow: { color: '#D7E3FF', lineHeight: 22 },
});
