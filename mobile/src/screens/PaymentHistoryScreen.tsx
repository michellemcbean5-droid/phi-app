import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import ScreenHero from '../components/hero/ScreenHero';
import Mascot from '../components/mascot/Mascot';
import StaggeredList from '../components/animations/StaggeredList';
import SkeletonShimmer from '../components/animations/SkeletonShimmer';
import BouncyButton from '../components/animations/BouncyButton';
import usePromoStore from '../store/promoStore';

interface PaymentRecord {
  id: string;
  date: string;
  amount: string;
  tier: string;
  paymentMethod: 'Stripe' | 'PayPal' | 'RevenueCat' | 'Google Play' | 'Promo';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  receiptId: string;
}

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: '1',
    date: '2025-07-01',
    amount: '$49.00',
    tier: 'Solo',
    paymentMethod: 'Stripe',
    status: 'completed',
    receiptId: 'pi_3OXXXXXXXXXXXXXXXX',
  },
  {
    id: '2',
    date: '2025-06-01',
    amount: '$49.00',
    tier: 'Solo',
    paymentMethod: 'Stripe',
    status: 'completed',
    receiptId: 'pi_3OXXXXXXXXXXXXXXXY',
  },
  {
    id: '3',
    date: '2025-05-01',
    amount: '$0.00',
    tier: 'Free',
    paymentMethod: 'Promo',
    status: 'completed',
    receiptId: 'PROMO_PHIFREE30',
  },
];

const STATUS_COLORS: Record<PaymentRecord['status'], string> = {
  completed: PHI_COLORS.moneyGreen,
  pending: PHI_COLORS.sunshineYellow,
  failed: '#FF5252',
  refunded: '#7F9FCC',
};

const METHOD_ICONS: Record<PaymentRecord['paymentMethod'], keyof typeof Ionicons.glyphMap> = {
  Stripe: 'card-outline',
  PayPal: 'logo-paypal',
  RevenueCat: 'phone-portrait-outline',
  'Google Play': 'logo-google-playstore',
  Promo: 'gift-outline',
};

type PaymentHistoryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PaymentHistory'>;

export default function PaymentHistoryScreen() {
  const navigation = useNavigation<PaymentHistoryNavigationProp>();
  const { getEffectiveTier } = usePromoStore();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setPayments(MOCK_PAYMENTS);
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setPayments(MOCK_PAYMENTS);
    setRefreshing(false);
  };

  const renderPaymentItem = (item: PaymentRecord, index: number) => (
    <View style={styles.paymentCard} key={item.id}>
      <View style={styles.paymentHeader}>
        <View style={styles.methodIcon}>
          <Ionicons name={METHOD_ICONS[item.paymentMethod]} size={22} color={PHI_COLORS.white} />
        </View>
        <View style={styles.paymentMeta}>
          <Text style={styles.tierText}>{item.tier} Plan</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <Text style={styles.amountText}>{item.amount}</Text>
        <Text style={styles.receiptText}>Receipt: {item.receiptId}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHero
        title="Payment History"
        subtitle="Your royal transactions 👑"
        mascotMood="happy"
        gradientColors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PHI_COLORS.sunshineYellow} />
        }
      >
        {loading ? (
          <View style={styles.skeletonContainer}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonShimmer key={i} style={styles.skeletonCard} />
            ))}
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Mascot mood="thinking" size={120} />
            <Text style={styles.emptyTitle}>No payments yet</Text>
            <Text style={styles.emptySub}>Your payment history will appear here once you make a purchase.</Text>
            <BouncyButton
              label="Upgrade Now →"
              onPress={() => navigation.navigate('Subscription')}
              variant="warning"
              size="md"
            />
          </View>
        ) : (
          <StaggeredList>
            {payments.map((p, i) => renderPaymentItem(p, i))}
          </StaggeredList>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 14 },
  skeletonContainer: { gap: 14 },
  skeletonCard: { height: 100, borderRadius: 18 },
  paymentCard: {
    backgroundColor: PHI_COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E3A62',
    gap: 10,
  },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E3A62',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMeta: { flex: 1 },
  tierText: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 16 },
  dateText: { color: '#7F9FCC', fontSize: 12 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 10 },
  paymentDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  amountText: { color: PHI_COLORS.sunshineYellow, fontWeight: '900', fontSize: 20 },
  receiptText: { color: '#7F9FCC', fontSize: 11 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  emptyTitle: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 20 },
  emptySub: { color: '#7F9FCC', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
  upgradeButton: {
    backgroundColor: PHI_COLORS.sunshineYellow,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  upgradeText: { color: PHI_COLORS.charcoalBlack, fontWeight: '900', fontSize: 15 },
});
