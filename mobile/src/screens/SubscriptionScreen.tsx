import React, { useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { updateSubscriptionTier } from '../api/stripeConnector';
import { UserTier, getWorkerLimit } from '../utils/subscriptionGating';
import { RootStackParamList } from '../navigation/RootNavigator';
import usePromoStore from '../store/promoStore';

type SubscriptionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Subscription'>;

interface Plan {
  tier: UserTier;
  price: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    tier: 'Solo',
    price: '$49/mo',
    tagline: 'Built for owner-operators getting started with PHI.',
    features: ['5 AI workers', 'Load search automation', 'Profit dashboard', 'Basic compliance alerts'],
  },
  {
    tier: 'Fleet',
    price: '$149/mo',
    tagline: 'Most Popular — Perfect for growing teams.',
    features: ['10 AI workers', 'Compliance automation', 'Document workflows', 'Auto-book mode', 'Fuel optimizer'],
    highlighted: true,
  },
  {
    tier: 'Enterprise',
    price: '$399/mo',
    tagline: 'Full PHI intelligence stack for advanced operations.',
    features: ['15 AI workers', 'Enterprise analytics', 'Priority AI support', 'Multi-driver dispatch', 'White-glove onboarding'],
  },
];

export default function SubscriptionScreen() {
  const navigation = useNavigation<SubscriptionNavigationProp>();
  const { activeTier, isTrialActive, daysRemaining, applyPromoCode } = usePromoStore();
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const trialActive = isTrialActive();
  const days = daysRemaining();
  const workerLimit = getWorkerLimit(activeTier);

  const handleChooseTier = async (tier: UserTier): Promise<void> => {
    const result = await updateSubscriptionTier('demo-user', tier);
    setStatusMessage(`${result.tier} activated — ${result.workerLimit} AI workers unlocked.`);
  };

  const handleRedeemPromo = async (): Promise<void> => {
    if (!promoInput.trim()) {
      Alert.alert('Enter a code', 'Type your promo code first.');
      return;
    }
    setPromoLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = applyPromoCode(promoInput.trim());
    setPromoLoading(false);
    setPromoInput('');
    if ('error' in result) {
      Alert.alert('Invalid Code', result.error);
    } else {
      Alert.alert('🎉 Activated!', result.message, [{ text: "Let's Go!" }]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Current Status Banner */}
        <View style={styles.statusBanner}>
          <Ionicons name="ribbon-outline" size={28} color={PHI_COLORS.sunshineYellow} />
          <Text style={styles.statusTier}>{activeTier} Plan</Text>
          <Text style={styles.statusWorkers}>{workerLimit} AI Workers Active</Text>
          {trialActive && (
            <View style={styles.trialChip}>
              <Text style={styles.trialChipText}>Free Trial — {days} days left</Text>
            </View>
          )}
          {statusMessage ? (
            <Text style={styles.statusMessage}>{statusMessage}</Text>
          ) : null}
        </View>

        {/* Quick Promo Code Entry */}
        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>Have a Promo Code?</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={styles.promoInput}
              value={promoInput}
              onChangeText={(t) => setPromoInput(t.toUpperCase())}
              placeholder="PHIFREE30"
              placeholderTextColor="#7F8FB3"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.promoButton, promoLoading && { opacity: 0.6 }]}
              onPress={() => void handleRedeemPromo()}
              disabled={promoLoading}
            >
              <Text style={styles.promoButtonText}>{promoLoading ? '...' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('PromoCode')}>
            <Text style={styles.promoLink}>Browse all promo codes →</Text>
          </TouchableOpacity>
        </View>

        {/* Plan Cards */}
        <Text style={styles.sectionLabel}>Choose Your Plan</Text>
        {plans.map((plan) => {
          const isSelected = activeTier === plan.tier;
          const workerCount = getWorkerLimit(plan.tier);
          return (
            <View
              key={plan.tier}
              style={[
                styles.card,
                plan.highlighted && styles.highlightedCard,
                isSelected && styles.selectedCard,
              ]}
            >
              {plan.highlighted && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              {isSelected && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>YOUR PLAN</Text>
                </View>
              )}
              <Text style={[styles.planTitle, plan.highlighted && styles.highlightedTitle]}>{plan.tier}</Text>
              <Text style={[styles.price, plan.highlighted && styles.highlightedPrice]}>{plan.price}</Text>
              <Text style={[styles.tagline, plan.highlighted && styles.highlightedTagline]}>{plan.tagline}</Text>
              <Text style={[styles.workerCount, plan.highlighted && styles.highlightedTagline]}>
                {workerCount} AI workers included
              </Text>
              {plan.features.map((feature) => (
                <Text key={feature} style={[styles.feature, plan.highlighted && styles.highlightedFeature]}>
                  ✓  {feature}
                </Text>
              ))}
              <TouchableOpacity
                style={[styles.ctaButton, plan.highlighted && styles.highlightedButton, isSelected && styles.selectedButton]}
                onPress={() => void handleChooseTier(plan.tier)}
              >
                <Text style={[styles.ctaText, isSelected && styles.selectedCtaText]}>
                  {isSelected ? 'Current Plan' : 'Start Free Trial'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.royalBlue },
  content: { padding: 16, gap: 16 },
  statusBanner: { backgroundColor: '#0A1F3D', borderRadius: 20, padding: 20, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#1E3A62' },
  statusTier: { color: PHI_COLORS.white, fontSize: 26, fontWeight: '900' },
  statusWorkers: { color: '#D7E3FF', fontSize: 14 },
  trialChip: { backgroundColor: PHI_COLORS.moneyGreen, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 5, marginTop: 4 },
  trialChipText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 13 },
  statusMessage: { color: PHI_COLORS.sunshineYellow, fontSize: 13, textAlign: 'center', marginTop: 4 },
  promoCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10 },
  promoTitle: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 15 },
  promoRow: { flexDirection: 'row', gap: 10 },
  promoInput: { flex: 1, backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: PHI_COLORS.sunshineYellow, fontWeight: '900', fontSize: 15, letterSpacing: 2, borderWidth: 1, borderColor: '#29508C' },
  promoButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  promoButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '900', fontSize: 15 },
  promoLink: { color: PHI_COLORS.sunshineYellow, fontSize: 13 },
  sectionLabel: { color: '#A8B7D8', fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: PHI_COLORS.white, borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#D0D8F0', gap: 6 },
  highlightedCard: { backgroundColor: PHI_COLORS.sunshineYellow },
  selectedCard: { borderColor: PHI_COLORS.moneyGreen, borderWidth: 3 },
  popularBadge: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4 },
  popularBadgeText: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 9 },
  activeBadge: { backgroundColor: PHI_COLORS.moneyGreen, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4 },
  activeBadgeText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 9 },
  planTitle: { color: PHI_COLORS.charcoalBlack, fontSize: 22, fontWeight: '900' },
  highlightedTitle: { color: PHI_COLORS.charcoalBlack },
  price: { color: PHI_COLORS.royalBlue, fontSize: 28, fontWeight: '900' },
  highlightedPrice: { color: '#0A3A7A' },
  tagline: { color: '#555', lineHeight: 20 },
  highlightedTagline: { color: PHI_COLORS.charcoalBlack },
  workerCount: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', marginTop: 4 },
  feature: { color: '#444', lineHeight: 20 },
  highlightedFeature: { color: PHI_COLORS.charcoalBlack },
  ctaButton: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 14, paddingVertical: 14, marginTop: 10 },
  highlightedButton: { backgroundColor: PHI_COLORS.charcoalBlack },
  selectedButton: { backgroundColor: '#3A5A3A' },
  ctaText: { color: PHI_COLORS.white, textAlign: 'center', fontWeight: '900' },
  selectedCtaText: { color: '#90EE90' },
});
