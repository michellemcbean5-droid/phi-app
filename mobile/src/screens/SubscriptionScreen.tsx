import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHI_COLORS } from '../assets/brandColors';
import { updateSubscriptionTier } from '../api/stripeConnector';
import { UserTier, getWorkerLimit } from '../utils/subscriptionGating';

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
    features: ['5 AI workers', 'Load search automation', 'Profit dashboard'],
  },
  {
    tier: 'Fleet',
    price: '$149/mo',
    tagline: 'Most Popular • Perfect for growing teams and dispatchers.',
    features: ['10 AI workers', 'Compliance automation', 'Document workflows'],
    highlighted: true,
  },
  {
    tier: 'Enterprise',
    price: '$399/mo',
    tagline: 'Full PHI intelligence stack for advanced operations.',
    features: ['15 AI workers', 'Enterprise analytics', 'Priority support'],
  },
];

export default function SubscriptionScreen() {
  const [selectedTier, setSelectedTier] = useState<UserTier>('Fleet');
  const [statusMessage, setStatusMessage] = useState('Start your free trial to unlock PHI automation.');

  const handleChooseTier = async (tier: UserTier): Promise<void> => {
    const result = await updateSubscriptionTier('demo-user', tier);
    setSelectedTier(result.tier);
    setStatusMessage(`${result.tier} activated with ${result.workerLimit} workers unlocked.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choose Your PHI Tier</Text>
        <Text style={styles.subtitle}>{statusMessage}</Text>

        {plans.map((plan) => {
          const isSelected = selectedTier === plan.tier;
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
              <Text style={[styles.planTitle, plan.highlighted && styles.highlightedTitle]}>{plan.tier}</Text>
              <Text style={styles.price}>{plan.price}</Text>
              <Text style={styles.tagline}>{plan.tagline}</Text>
              <Text style={styles.workerCount}>{workerCount} workers included</Text>
              {plan.features.map((feature) => (
                <Text key={feature} style={styles.feature}>• {feature}</Text>
              ))}
              <TouchableOpacity
                style={[styles.ctaButton, plan.highlighted && styles.highlightedButton]}
                onPress={() => {
                  void handleChooseTier(plan.tier);
                }}
              >
                <Text style={styles.ctaText}>Start Free Trial</Text>
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
  content: { padding: 16, gap: 18 },
  title: { color: PHI_COLORS.white, fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#E7EEFF', lineHeight: 20 },
  card: { backgroundColor: PHI_COLORS.white, borderRadius: 20, padding: 20, borderWidth: 3, borderColor: PHI_COLORS.charcoalBlack, shadowColor: PHI_COLORS.charcoalBlack, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  highlightedCard: { backgroundColor: PHI_COLORS.sunshineYellow },
  selectedCard: { borderColor: PHI_COLORS.moneyGreen },
  planTitle: { color: PHI_COLORS.charcoalBlack, fontSize: 24, fontWeight: '900' },
  highlightedTitle: { color: PHI_COLORS.charcoalBlack },
  price: { color: PHI_COLORS.royalBlue, fontSize: 30, fontWeight: '900', marginTop: 6 },
  tagline: { color: PHI_COLORS.charcoalBlack, marginTop: 8, lineHeight: 20 },
  workerCount: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', marginTop: 12 },
  feature: { color: PHI_COLORS.charcoalBlack, marginTop: 8, lineHeight: 20 },
  ctaButton: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 14, paddingVertical: 14, marginTop: 16 },
  highlightedButton: { backgroundColor: PHI_COLORS.charcoalBlack },
  ctaText: { color: PHI_COLORS.white, textAlign: 'center', fontWeight: '900' },
});
