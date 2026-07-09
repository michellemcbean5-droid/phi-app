import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PHI_COLORS } from '../../assets/brandColors';
import BouncyButton from '../animations/BouncyButton';
import Mascot from '../mascot/Mascot';
import MascotSpeechBubble from '../mascot/MascotSpeechBubble';
import {
  openPayPalCheckout,
  openPayPalSubscription,
  TIER_PAYPAL_PLAN_IDS,
  isPayPalConfigured,
} from '../../api/payPalPayments';
import type { UserTier } from '../../utils/subscriptionGating';

interface PayPalButtonProps {
  tier: UserTier;
  billingPeriod?: 'monthly' | 'annual';
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (message: string) => void;
}

/**
 * PayPal checkout button component.
 * Opens PayPal checkout for one-time or subscription payments.
 */
export default function PayPalButton({
  tier,
  billingPeriod = 'monthly',
  onSuccess,
  onCancel,
  onError,
}: PayPalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [mascotMessage, setMascotMessage] = useState('');
  const [mascotMood, setMascotMood] = useState<'happy' | 'thinking' | 'celebrating' | 'warning'>('happy');

  const handlePay = useCallback(async () => {
    if (!isPayPalConfigured()) {
      setMascotMood('warning');
      setMascotMessage('PayPal is not set up yet. Ask Michelle to enable it!');
      onError?.('PayPal is not configured.');
      return;
    }

    setLoading(true);
    setMascotMood('thinking');
    setMascotMessage('Opening PayPal checkout...');

    const planIds = TIER_PAYPAL_PLAN_IDS[tier];
    const planId = billingPeriod === 'annual' ? planIds?.annual : planIds?.monthly;

    const result = planId
      ? await openPayPalSubscription({ planId })
      : await openPayPalCheckout({
          amount: getTierAmount(tier, billingPeriod),
          currency: 'USD',
          description: `${tier} plan — ${billingPeriod}`,
        });

    setLoading(false);

    if (result.success) {
      setMascotMood('celebrating');
      setMascotMessage(`🎉 ${tier} plan activated via PayPal!`);
      onSuccess?.();
    } else {
      const isCancel = result.error?.toLowerCase().includes('cancel');
      if (isCancel) {
        setMascotMood('happy');
        setMascotMessage('No worries — you can upgrade anytime!');
        onCancel?.();
      } else {
        setMascotMood('warning');
        setMascotMessage(`Oops! ${result.error}`);
        onError?.(result.error ?? 'PayPal payment failed');
      }
    }
  }, [tier, billingPeriod, onSuccess, onCancel, onError]);

  return (
    <View style={styles.container}>
      {mascotMessage ? (
        <MascotSpeechBubble message={mascotMessage} mood={mascotMood} onDismiss={() => setMascotMessage('')} />
      ) : null}
      <View style={styles.mascotRow}>
        <Mascot mood={mascotMood} size={64} />
      </View>

      <BouncyButton
        onPress={handlePay}
        disabled={loading}
        style={styles.payButton}
        backgroundColor="#0070BA"
        textColor="#FFFFFF"
      >
        {loading ? (
          <View style={styles.row}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={styles.payText}>  Processing…</Text>
          </View>
        ) : (
          <Text style={styles.payText}>🅿️ Pay with PayPal</Text>
        )}
      </BouncyButton>

      <Text style={styles.note}>🔒 Secured by PayPal · Test mode enabled</Text>
    </View>
  );
}

function getTierAmount(tier: UserTier, period: 'monthly' | 'annual'): string {
  const base: Record<Exclude<UserTier, 'Free'>, number> = {
    Solo: 49,
    Fleet: 149,
    Enterprise: 399,
  };
  const amount = base[tier as Exclude<UserTier, 'Free'>] ?? 0;
  const total = period === 'annual' ? amount * 10 : amount;
  return total.toFixed(2);
}

const styles = StyleSheet.create({
  container: { gap: 12, alignItems: 'center' },
  mascotRow: { alignItems: 'center', marginBottom: 4 },
  payButton: { width: '100%', backgroundColor: '#0070BA', borderRadius: 16, paddingVertical: 16 },
  payText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  note: { color: '#7F9FCC', fontSize: 11, textAlign: 'center', marginTop: 4 },
});
