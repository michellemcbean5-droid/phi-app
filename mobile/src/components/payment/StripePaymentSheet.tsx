import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PHI_COLORS } from '../../assets/brandColors';
import AnimatedPressable from '../game/AnimatedPressable';
import Mascot from '../mascot/Mascot';
import {
  createPaymentIntent,
  presentPaymentSheet,
  confirmSubscription,
  isStripeConfigured,
  getTierAmountCents,
} from '../../api/stripePayments';

export interface StripePaymentSheetProps {
  /** Amount in cents (e.g. 4900 for $49.00). Ignored if tierName is provided. */
  amount?: number;
  /** ISO currency code (default: 'usd'). */
  currency?: string;
  /** Internal tier name — maps to Stripe Price IDs. Overrides amount when set. */
  tierName?: string;
  /** Called when the payment succeeds. */
  onSuccess?: (result: { paymentIntentId?: string; tierName?: string }) => void;
  /** Called when the payment fails or is cancelled. */
  onError?: (message: string) => void;
}

/**
 * Reusable Stripe Payment Sheet component.
 *
 * Supports two modes:
 *  1. One-time purchase: pass `amount` + `currency`
 *  2. Subscription: pass `tierName` (maps to Stripe Price IDs)
 *
 * Initializes Stripe with publishable key from env, opens the Payment Sheet,
 * and handles success/failure callbacks.
 */
export default function StripePaymentSheet({
  amount,
  currency = 'usd',
  tierName,
  onSuccess,
  onError,
}: StripePaymentSheetProps) {
  const [loading, setLoading] = useState(false);
  const [mascotMood, setMascotMood] = useState<'happy' | 'thinking' | 'celebrating' | 'warning'>('happy');
  const [mascotMessage, setMascotMessage] = useState('');

  const handlePay = useCallback(async () => {
    if (!isStripeConfigured()) {
      setMascotMood('warning');
      setMascotMessage('Stripe is not set up yet. Ask Michelle to enable payments!');
      onError?.('Stripe is not configured. Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env');
      return;
    }

    setLoading(true);
    setMascotMood('thinking');
    setMascotMessage('Connecting to the payment gateway…');

    let result: { success: boolean; error?: string; paymentIntentId?: string };

    if (tierName) {
      // Subscription mode
      result = await confirmSubscription(tierName);
    } else if (typeof amount === 'number') {
      // One-time purchase mode
      const { clientSecret, error } = await createPaymentIntent(amount, currency);
      if (!clientSecret) {
        result = { success: false, error: error ?? 'Could not create payment intent.' };
      } else {
        result = await presentPaymentSheet(clientSecret);
      }
    } else {
      result = { success: false, error: 'Either amount or tierName must be provided.' };
    }

    setLoading(false);

    if (result.success) {
      setMascotMood('celebrating');
      setMascotMessage(tierName ? `🎉 ${tierName} plan activated! Welcome to the royal fleet!` : '🎉 Payment successful!');
      onSuccess?.({ paymentIntentId: result.paymentIntentId, tierName });
    } else {
      const isCancel = result.error?.toLowerCase().includes('cancel');
      if (isCancel) {
        setMascotMood('happy');
        setMascotMessage('No worries — you can upgrade anytime!');
      } else {
        setMascotMood('warning');
        setMascotMessage(`Oops! ${result.error}`);
        onError?.(result.error ?? 'Payment failed');
      }
    }
  }, [amount, currency, tierName, onSuccess, onError]);

  const handleDismissMascot = () => {
    setMascotMessage('');
    setMascotMood('happy');
  };

  return (
    <View style={styles.container}>
      {/* Mascot feedback */}
      {mascotMessage ? (
        <View style={styles.mascotBubble}>
          <Mascot mood={mascotMood} size={48} />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{mascotMessage}</Text>
            <Text style={styles.bubbleDismiss} onPress={handleDismissMascot}>
              Dismiss
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.mascotRow}>
          <Mascot mood={mascotMood} size={48} />
        </View>
      )}

      {/* Pay button */}
      <AnimatedPressable
        onPress={handlePay}
        disabled={loading}
        style={styles.payButton}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.payText}>  Processing…</Text>
            </>
          ) : (
            <Text style={styles.payText}>💳 Pay with Card</Text>
          )}
        </View>
      </AnimatedPressable>

      <Text style={styles.note}>🔒 Secured by Stripe · Test mode enabled</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, alignItems: 'center', width: '100%' },
  mascotRow: { alignItems: 'center', marginBottom: 4 },
  mascotBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#132B52',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#29508C',
  },
  bubble: { flex: 1, gap: 4 },
  bubbleText: { color: PHI_COLORS.white, fontSize: 13, lineHeight: 18 },
  bubbleDismiss: { color: '#7F9FCC', fontSize: 11, textDecorationLine: 'underline' },
  payButton: {
    width: '100%',
    backgroundColor: '#635BFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, textAlign: 'center' },
  note: { color: '#7F9FCC', fontSize: 11, textAlign: 'center', marginTop: 4 },
});
