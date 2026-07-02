import React, { useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import {
  fetchSubscriptionPlans, initBilling, endBilling, isBillingSupported,
  listenForPurchases, purchaseTier, restoreActiveTier, SUBSCRIPTION_SKUS,
} from '../api/googlePlayBilling';
import { UserTier } from '../utils/subscriptionGating';
import { RootStackParamList } from '../navigation/RootNavigator';
import usePromoStore from '../store/promoStore';
import AnimatedPressable from '../components/game/AnimatedPressable';

type SubscriptionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Subscription'>;

type PaidTier = 'Solo' | 'Fleet' | 'Enterprise';

interface Plan {
  tier: UserTier;
  fallbackPrice: string;
  tagline: string;
  features: string[];
}

const plans: Plan[] = [
  {
    tier: 'Free',
    fallbackPrice: '$0/mo',
    tagline: 'Free forever — bring your own AI key and run the full stack.',
    features: [
      'All 10 AI workers (bring your own free API key)',
      '1 truck or van profile',
      'Up to 20 stored documents',
      '5-minute load proximity alerts',
    ],
  },
  {
    tier: 'Solo',
    fallbackPrice: '$49/mo',
    tagline: 'For owner-operators who want unlimited storage and faster alerts.',
    features: ['Everything in Free', 'Unlimited document storage', '1-minute priority load alerts', 'Priority support from Michelle'],
  },
  {
    tier: 'Fleet',
    fallbackPrice: '$149/mo',
    tagline: 'Most Popular — for drivers managing more than one truck.',
    features: ['Everything in Solo', 'Up to 5 trucks or vans', 'Multi-driver ready'],
  },
  {
    tier: 'Enterprise',
    fallbackPrice: '$399/mo',
    tagline: 'Full PHI stack — including AI with no key setup required.',
    features: ['Everything in Fleet', 'Unlimited trucks/vans', 'Managed AI — we run the AI for you, no API key needed', 'Enterprise analytics'],
  },
];

export default function SubscriptionScreen() {
  const navigation = useNavigation<SubscriptionNavigationProp>();
  const { activeTier, isTrialActive, daysRemaining, applyPromoCode, setActiveTier, getEffectiveTier } = usePromoStore();
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [purchasingTier, setPurchasingTier] = useState<PaidTier | null>(null);
  const [livePrices, setLivePrices] = useState<Partial<Record<PaidTier, string>>>({});
  const [billingReady, setBillingReady] = useState(false);

  const trialActive = isTrialActive();
  const days = daysRemaining();
  const effectiveTier = getEffectiveTier();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    void initBilling().then(async (connected) => {
      setBillingReady(connected);
      if (!connected) return;

      const subs = await fetchSubscriptionPlans();
      const prices: Partial<Record<PaidTier, string>> = {};
      (Object.keys(SUBSCRIPTION_SKUS) as PaidTier[]).forEach((tier) => {
        const sub = subs.find((s) => s.productId === SUBSCRIPTION_SKUS[tier]);
        const offer = sub && 'subscriptionOfferDetails' in sub ? sub.subscriptionOfferDetails?.[0] : undefined;
        const price = offer?.pricingPhases.pricingPhaseList[0]?.formattedPrice;
        if (price) prices[tier] = price;
      });
      setLivePrices(prices);

      cleanup = listenForPurchases(
        (tier) => {
          setActiveTier(tier);
          setPurchasingTier(null);
          setStatusMessage(`${tier} activated — thank you!`);
        },
        (message) => {
          setPurchasingTier(null);
          Alert.alert('Purchase Failed', message);
        },
      );
    });

    return () => {
      cleanup?.();
      void endBilling();
    };
  }, [setActiveTier]);

  const handleChooseTier = async (tier: UserTier): Promise<void> => {
    if (tier === 'Free') {
      setActiveTier('Free');
      setStatusMessage('Switched to the Free plan.');
      return;
    }
    if (!isBillingSupported()) {
      Alert.alert('Android Only', 'Google Play subscriptions are only available in the Android app.');
      return;
    }
    setPurchasingTier(tier as PaidTier);
    const result = await purchaseTier(tier as PaidTier);
    if (!result.started) {
      setPurchasingTier(null);
      Alert.alert('Can’t Start Purchase', result.message);
    }
    // On success, the purchase listener above grants the tier once Play confirms it.
  };

  const handleRestore = async (): Promise<void> => {
    const tier = await restoreActiveTier();
    if (tier) {
      setActiveTier(tier);
      Alert.alert('Restored', `Your ${tier} subscription was restored.`);
    } else {
      Alert.alert('Nothing to Restore', 'No active Play subscription was found on this account.');
    }
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
          <Text style={styles.statusTier}>{effectiveTier} Plan</Text>
          <Text style={styles.statusWorkers}>All 10 AI workers included — free with your own API key</Text>
          {trialActive && (
            <View style={styles.trialChip}>
              <Text style={styles.trialChipText}>Free Trial — {days} days left</Text>
            </View>
          )}
          {!billingReady && (
            <Text style={styles.billingNote}>
              {isBillingSupported() ? 'Connecting to Google Play…' : 'Play Billing is only available in the Android app.'}
            </Text>
          )}
          {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
        </View>

        {/* Equipment Marketplace CTA */}
        <TouchableOpacity style={styles.marketplaceCard} onPress={() => navigation.navigate('EquipmentMarketplace')}>
          <Ionicons name="car-sport-outline" size={26} color={PHI_COLORS.charcoalBlack} />
          <View style={{ flex: 1 }}>
            <Text style={styles.marketplaceTitle}>Need a truck or van?</Text>
            <Text style={styles.marketplaceSub}>Browse purchase & lease options by job type →</Text>
          </View>
        </TouchableOpacity>

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
          const isSelected = effectiveTier === plan.tier;
          const isPaid = plan.tier !== 'Free';
          const isPurchasing = purchasingTier === plan.tier;
          const displayPrice = isPaid ? (livePrices[plan.tier as PaidTier] ?? plan.fallbackPrice) : plan.fallbackPrice;
          const highlighted = plan.tier === 'Fleet';
          return (
            <View
              key={plan.tier}
              style={[styles.card, highlighted && styles.highlightedCard, isSelected && styles.selectedCard]}
            >
              {highlighted && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              {isSelected && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>YOUR PLAN</Text>
                </View>
              )}
              <Text style={[styles.planTitle, highlighted && styles.highlightedTitle]}>{plan.tier}</Text>
              <Text style={[styles.price, highlighted && styles.highlightedPrice]}>{displayPrice}</Text>
              <Text style={[styles.tagline, highlighted && styles.highlightedTagline]}>{plan.tagline}</Text>
              {plan.features.map((feature) => (
                <Text key={feature} style={[styles.feature, highlighted && styles.highlightedFeature]}>
                  ✓  {feature}
                </Text>
              ))}
              <AnimatedPressable
                style={[styles.ctaButton, highlighted && styles.highlightedButton, isSelected && styles.selectedButton]}
                onPress={() => void handleChooseTier(plan.tier)}
                disabled={isSelected || isPurchasing}
              >
                <Text style={[styles.ctaText, isSelected && styles.selectedCtaText]}>
                  {isSelected ? 'Current Plan' : isPurchasing ? 'Opening Play Store…' : isPaid ? 'Subscribe' : 'Switch to Free'}
                </Text>
              </AnimatedPressable>
            </View>
          );
        })}

        <TouchableOpacity style={styles.restoreLink} onPress={() => void handleRestore()}>
          <Text style={styles.restoreLinkText}>Restore purchases</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.royalBlue },
  content: { padding: 16, gap: 16 },
  statusBanner: { backgroundColor: '#0A1F3D', borderRadius: 20, padding: 20, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#1E3A62' },
  statusTier: { color: PHI_COLORS.white, fontSize: 26, fontWeight: '900' },
  statusWorkers: { color: '#D7E3FF', fontSize: 14, textAlign: 'center' },
  trialChip: { backgroundColor: PHI_COLORS.moneyGreen, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 5, marginTop: 4 },
  trialChipText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 13 },
  billingNote: { color: '#7F9FCC', fontSize: 12, marginTop: 4, textAlign: 'center' },
  statusMessage: { color: PHI_COLORS.sunshineYellow, fontSize: 13, textAlign: 'center', marginTop: 4 },
  marketplaceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: PHI_COLORS.sunshineYellow,
    borderRadius: 16, padding: 16,
  },
  marketplaceTitle: { color: PHI_COLORS.charcoalBlack, fontWeight: '900', fontSize: 15 },
  marketplaceSub: { color: '#3A3A00', fontSize: 12, marginTop: 2 },
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
  feature: { color: '#444', lineHeight: 20 },
  highlightedFeature: { color: PHI_COLORS.charcoalBlack },
  ctaButton: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 14, paddingVertical: 14, marginTop: 10 },
  highlightedButton: { backgroundColor: PHI_COLORS.charcoalBlack },
  selectedButton: { backgroundColor: '#3A5A3A' },
  ctaText: { color: PHI_COLORS.white, textAlign: 'center', fontWeight: '900' },
  selectedCtaText: { color: '#90EE90' },
  restoreLink: { alignItems: 'center', paddingVertical: 10 },
  restoreLinkText: { color: '#D7E3FF', fontSize: 13, textDecorationLine: 'underline' },
});
