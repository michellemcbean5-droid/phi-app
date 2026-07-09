import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PHI_COLORS } from '../assets/brandColors';
import {
  fetchSubscriptionPlans, initBilling, endBilling, isBillingSupported,
  listenForPurchases, purchaseTier, restoreActiveTier, SUBSCRIPTION_SKUS,
} from '../api/googlePlayBilling';
import { UserTier } from '../utils/subscriptionGating';
import { RootStackParamList } from '../navigation/RootNavigator';
import usePromoStore from '../store/promoStore';
import PrinceHaulMascot from '../components/mascot/PrinceHaulMascot';
import BouncyButton from '../components/animations/BouncyButton';
import StaggeredList from '../components/animations/StaggeredList';
import ConfettiCelebration from '../components/animations/ConfettiCelebration';
import FloatingShapes from '../components/animations/FloatingShapes';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS, CARTOON_TYPOGRAPHY } from '../theme/cartoonTheme';

type SubscriptionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Subscription'>;

type PaidTier = 'Solo' | 'Fleet' | 'Enterprise';

interface Plan {
  tier: UserTier;
  fallbackPrice: string;
  tagline: string;
  features: string[];
  gradient: readonly [string, string, ...string[]];
  mascotMood: 'happy' | 'excited' | 'celebrating';
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
    gradient: CARTOON_COLORS.gradientForest,
    mascotMood: 'happy',
  },
  {
    tier: 'Solo',
    fallbackPrice: '$49/mo',
    tagline: 'For owner-operators who want unlimited storage and faster alerts.',
    features: ['Everything in Free', 'Unlimited document storage', '1-minute priority load alerts', 'Priority support from Michelle'],
    gradient: CARTOON_COLORS.gradientOcean,
    mascotMood: 'excited',
  },
  {
    tier: 'Fleet',
    fallbackPrice: '$149/mo',
    tagline: 'Most Popular — for drivers managing more than one truck.',
    features: ['Everything in Solo', 'Up to 5 trucks or vans', 'Multi-driver ready'],
    gradient: CARTOON_COLORS.gradientSunset,
    mascotMood: 'celebrating',
  },
  {
    tier: 'Enterprise',
    fallbackPrice: '$399/mo',
    tagline: 'Full PHI stack — including AI with no key setup required.',
    features: ['Everything in Fleet', 'Unlimited trucks/vans', 'Managed AI — we run the AI for you, no API key needed', 'Enterprise analytics'],
    gradient: CARTOON_COLORS.gradientCandy,
    mascotMood: 'celebrating',
  },
];

const MASCOT_TIPS = [
  'Pick the plan that fits your fleet!',
  'Fleet plan is our most popular! 🚛',
  'Enterprise gets you managed AI!',
  'Free plan works great with your own key!',
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
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [mascotTip, setMascotTip] = useState(MASCOT_TIPS[0]);
  const [mascotMood, setMascotMood] = useState<'happy' | 'excited' | 'celebrating'>('happy');

  const trialActive = isTrialActive();
  const days = daysRemaining();
  const effectiveTier = getEffectiveTier();

  React.useEffect(() => {
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
          setStatusMessage(`${tier} activated — thank you! 🎉`);
          setConfettiTrigger((prev) => prev + 1);
          setMascotMood('celebrating');
          setTimeout(() => setMascotMood('happy'), 4000);
        },
        (message) => {
          setPurchasingTier(null);
          setMascotMood('happy');
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
      setStatusMessage('Switched to the Free plan! 🎉');
      setMascotMood('happy');
      return;
    }
    if (!isBillingSupported()) {
      return;
    }
    setPurchasingTier(tier as PaidTier);
    const result = await purchaseTier(tier as PaidTier);
    if (!result.started) {
      setPurchasingTier(null);
    }
  };

  const handleRestore = async (): Promise<void> => {
    const tier = await restoreActiveTier();
    if (tier) {
      setActiveTier(tier);
      setConfettiTrigger((prev) => prev + 1);
      setMascotMood('celebrating');
    }
  };

  const handleMascotPress = () => {
    const randomTip = MASCOT_TIPS[Math.floor(Math.random() * MASCOT_TIPS.length)];
    setMascotTip(randomTip);
    setMascotMood('excited');
    setTimeout(() => setMascotMood('happy'), 2000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FloatingShapes shapeCount={6} />
      <ConfettiCelebration trigger={confettiTrigger} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Header with Mascot */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Choose Your Plan 🚛</Text>
            <Text style={styles.subtitle}>Prince Haul has picked the best options for you!</Text>
          </View>
          <PrinceHaulMascot
            mood={mascotMood}
            size={80}
            onPress={handleMascotPress}
            showSpeechBubble={true}
            speechText={mascotTip}
          />
        </View>

        {/* Current Status Banner */}
        <LinearGradient
          colors={CARTOON_COLORS.gradientCandy}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statusBanner}
        >
          <Ionicons name="ribbon-outline" size={32} color="#FFFFFF" />
          <Text style={styles.statusTier}>{effectiveTier} Plan ⭐</Text>
          <Text style={styles.statusWorkers}>All 10 AI workers included — free with your own API key</Text>
          {trialActive && (
            <View style={styles.trialChip}>
              <Text style={styles.trialChipText}>🎁 Free Trial — {days} days left</Text>
            </View>
          )}
          {!billingReady && (
            <Text style={styles.billingNote}>
              {isBillingSupported() ? 'Connecting to Google Play…' : 'Play Billing is only available in the Android app.'}
            </Text>
          )}
          {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
        </LinearGradient>

        {/* Plan Cards */}
        <StaggeredList staggerDelay={100} direction="up">
          {plans.map((plan) => {
            const isSelected = effectiveTier === plan.tier;
            const isPaid = plan.tier !== 'Free';
            const isPurchasing = purchasingTier === plan.tier;
            const displayPrice = isPaid ? (livePrices[plan.tier as PaidTier] ?? plan.fallbackPrice) : plan.fallbackPrice;
            const highlighted = plan.tier === 'Fleet';

            return (
              <LinearGradient
                key={plan.tier}
                colors={isSelected ? ['#FFFFFF', '#FFFFFF'] : plan.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.card,
                  highlighted && styles.highlightedCard,
                  isSelected && styles.selectedCard,
                ]}
              >
                {highlighted && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>🔥 MOST POPULAR</Text>
                  </View>
                )}
                {isSelected && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>✓ YOUR PLAN</Text>
                  </View>
                )}
                <View style={styles.cardHeader}>
                  <PrinceHaulMascot mood={plan.mascotMood} size={50} showSpeechBubble={false} />
                  <View style={styles.cardTitleWrap}>
                    <Text style={[styles.planTitle, highlighted && styles.highlightedTitle]}>{plan.tier}</Text>
                    <Text style={[styles.price, highlighted && styles.highlightedPrice]}>{displayPrice}</Text>
                  </View>
                </View>
                <Text style={[styles.tagline, highlighted && styles.highlightedTagline]}>{plan.tagline}</Text>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color={isSelected ? CARTOON_COLORS.limeGreen : '#FFFFFF'} />
                    <Text style={[styles.feature, highlighted && styles.highlightedFeature]}>{feature}</Text>
                  </View>
                ))}
                <BouncyButton
                  label={isSelected ? '✓ Current Plan' : isPurchasing ? 'Opening Play Store…' : isPaid ? 'Subscribe' : 'Switch to Free'}
                  onPress={() => void handleChooseTier(plan.tier)}
                  variant={isSelected ? 'success' : highlighted ? 'warning' : 'primary'}
                  size="md"
                  disabled={isSelected || isPurchasing}
                />
              </LinearGradient>
            );
          })}
        </StaggeredList>

        <BouncyButton
          label="🔄 Restore Purchases"
          onPress={() => void handleRestore()}
          variant="secondary"
          size="sm"
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { padding: 16, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerLeft: { flex: 1, marginRight: 12 },
  title: { color: CARTOON_COLORS.charcoal, fontSize: 28, fontWeight: '900' },
  subtitle: { color: CARTOON_COLORS.slate, fontSize: 14, marginTop: 4, fontWeight: '600' },
  statusBanner: { borderRadius: CARTOON_RADIUS.xl, padding: 24, alignItems: 'center', gap: 8, ...CARTOON_SHADOWS.lg },
  statusTier: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  statusWorkers: { color: 'rgba(255,255,255,0.9)', fontSize: 14, textAlign: 'center', fontWeight: '600' },
  trialChip: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: CARTOON_RADIUS.pill, paddingHorizontal: 16, paddingVertical: 6, marginTop: 4 },
  trialChipText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  billingNote: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, textAlign: 'center' },
  statusMessage: { color: CARTOON_COLORS.sunshineYellow, fontSize: 14, textAlign: 'center', marginTop: 4, fontWeight: '700' },
  card: { borderRadius: CARTOON_RADIUS.xl, padding: 20, gap: 8, ...CARTOON_SHADOWS.md },
  highlightedCard: { borderWidth: 3, borderColor: CARTOON_COLORS.sunshineYellow },
  selectedCard: { borderWidth: 3, borderColor: CARTOON_COLORS.limeGreen, backgroundColor: '#FFFFFF' },
  popularBadge: { backgroundColor: CARTOON_COLORS.sunshineYellow, borderRadius: CARTOON_RADIUS.pill, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 4 },
  popularBadgeText: { color: CARTOON_COLORS.charcoal, fontWeight: '800', fontSize: 10 },
  activeBadge: { backgroundColor: CARTOON_COLORS.limeGreen, borderRadius: CARTOON_RADIUS.pill, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 4 },
  activeBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  cardTitleWrap: { flex: 1 },
  planTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  highlightedTitle: { color: '#FFFFFF' },
  price: { color: 'rgba(255,255,255,0.9)', fontSize: 24, fontWeight: '900' },
  highlightedPrice: { color: '#FFFFFF' },
  tagline: { color: 'rgba(255,255,255,0.9)', lineHeight: 20, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  highlightedTagline: { color: 'rgba(255,255,255,0.95)' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  feature: { color: 'rgba(255,255,255,0.95)', lineHeight: 20, fontSize: 13, fontWeight: '600', flex: 1 },
  highlightedFeature: { color: '#FFFFFF' },
});
