import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { PHI_COLORS } from '../../assets/brandColors';
import BouncyButton from '../animations/BouncyButton';
import Mascot from '../mascot/Mascot';
import MascotSpeechBubble from '../mascot/MascotSpeechBubble';
import {
  fetchOfferings,
  purchasePackage,
  restorePurchases,
  isRevenueCatConfigured,
  tierFromCustomerInfo,
} from '../../api/revenueCatBilling';
import { TIER_CONFIG, type RevenueCatTierId } from '../../config/revenueCat';
import type { UserTier } from '../../utils/subscriptionGating';
import usePromoStore from '../../store/promoStore';

interface RevenueCatPurchaseProps {
  tier: UserTier;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (message: string) => void;
}

/**
 * RevenueCat purchase button component.
 * Completes the existing RevenueCat stubs with real purchase calls.
 */
export default function RevenueCatPurchase({
  tier,
  onSuccess,
  onCancel,
  onError,
}: RevenueCatPurchaseProps) {
  const { setActiveTier } = usePromoStore();
  const [loading, setLoading] = useState(false);
  const [mascotMessage, setMascotMessage] = useState('');
  const [mascotMood, setMascotMood] = useState<'happy' | 'thinking' | 'celebrating' | 'warning'>('happy');

  const handlePurchase = useCallback(async () => {
    if (!isRevenueCatConfigured()) {
      setMascotMood('warning');
      setMascotMessage('RevenueCat is not set up yet. Ask Michelle to enable in-app purchases!');
      onError?.('RevenueCat is not configured.');
      return;
    }

    if (tier === 'Free') {
      setActiveTier('Free');
      setMascotMood('happy');
      setMascotMessage('You are on the Free plan — bring your own AI key!');
      onSuccess?.();
      return;
    }

    setLoading(true);
    setMascotMood('thinking');
    setMascotMessage('Connecting to the App Store...');

    const offerings = await fetchOfferings();
    if (!offerings) {
      setLoading(false);
      setMascotMood('warning');
      setMascotMessage('Could not load offerings. Try again later!');
      onError?.('Could not load offerings.');
      return;
    }

    const tierId = tier.toLowerCase() as RevenueCatTierId;
    const config = TIER_CONFIG[tierId];
    const offering = offerings.current ?? offerings.all[REVENUECAT_OFFERING_ID];
    const pkg = offering?.availablePackages.find(
      (p) => p.product.identifier === config.revenueCatProductId
    );

    if (!pkg) {
      setLoading(false);
      setMascotMood('warning');
      setMascotMessage('This plan is not available in the store yet.');
      onError?.('Package not found for tier.');
      return;
    }

    const result = await purchasePackage(pkg);
    setLoading(false);

    if (result.success && result.customerInfo) {
      const grantedTier = tierFromCustomerInfo(result.customerInfo);
      setActiveTier(grantedTier);
      setMascotMood('celebrating');
      setMascotMessage(`🎉 ${grantedTier} plan activated! Welcome to the royal fleet!`);
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
        onError?.(result.error ?? 'Purchase failed');
      }
    }
  }, [tier, onSuccess, onCancel, onError, setActiveTier]);

  const handleRestore = useCallback(async () => {
    if (!isRevenueCatConfigured()) {
      setMascotMood('warning');
      setMascotMessage('RevenueCat is not set up yet.');
      return;
    }

    setLoading(true);
    setMascotMood('thinking');
    setMascotMessage('Restoring your purchases...');

    const result = await restorePurchases();
    setLoading(false);

    if (result.success && result.customerInfo) {
      const restoredTier = tierFromCustomerInfo(result.customerInfo);
      setActiveTier(restoredTier);
      setMascotMood('celebrating');
      setMascotMessage(`✅ ${restoredTier} plan restored!`);
      onSuccess?.();
    } else {
      setMascotMood('warning');
      setMascotMessage('No previous purchases found to restore.');
      onError?.(result.error ?? 'Restore failed');
    }
  }, [onSuccess, onError, setActiveTier]);

  return (
    <View style={styles.container}>
      {mascotMessage ? (
        <MascotSpeechBubble message={mascotMessage} mood={mascotMood} onDismiss={() => setMascotMessage('')} />
      ) : null}
      <View style={styles.mascotRow}>
        <Mascot mood={mascotMood} size={64} />
      </View>

      <BouncyButton
        onPress={handlePurchase}
        disabled={loading}
        style={styles.payButton}
        backgroundColor={PHI_COLORS.moneyGreen}
        textColor={PHI_COLORS.charcoalBlack}
      >
        {loading ? (
          <View style={styles.row}>
            <ActivityIndicator color={PHI_COLORS.charcoalBlack} size="small" />
            <Text style={styles.payText}>  Processing…</Text>
          </View>
        ) : (
          <Text style={styles.payText}>📱 In-App Purchase</Text>
        )}
      </BouncyButton>

      <BouncyButton
        onPress={handleRestore}
        disabled={loading}
        style={styles.restoreButton}
        backgroundColor="transparent"
        textColor={PHI_COLORS.sunshineYellow}
        borderColor={PHI_COLORS.sunshineYellow}
      >
        <Text style={styles.restoreText}>🔄 Restore Purchases</Text>
      </BouncyButton>
    </View>
  );
}

import { REVENUECAT_OFFERING_ID } from '../../config/revenueCat';

const styles = StyleSheet.create({
  container: { gap: 12, alignItems: 'center' },
  mascotRow: { alignItems: 'center', marginBottom: 4 },
  payButton: { width: '100%', backgroundColor: PHI_COLORS.moneyGreen, borderRadius: 16, paddingVertical: 16 },
  restoreButton: { width: '100%', borderRadius: 16, paddingVertical: 14, borderWidth: 2 },
  payText: { color: PHI_COLORS.charcoalBlack, fontWeight: '900', fontSize: 16, textAlign: 'center' },
  restoreText: { color: PHI_COLORS.sunshineYellow, fontWeight: '900', fontSize: 14, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
