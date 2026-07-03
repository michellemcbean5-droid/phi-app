import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import useLoadsStore, { PaymentStatus } from '../store/loadsStore';
import useExpenseStore, { ExpenseCategory } from '../store/expenseStore';
import useProfileStore from '../store/profileStore';
import { calculateRPMTrend, categorizeExpense, PHI_ProfitFormula, projectYearlyRevenue } from '../utils/profitFormula';

type EarningsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Earnings'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  invoice_sent: 'Invoice Sent',
  paid: 'Paid',
};

const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  unpaid: '#FF5252',
  invoice_sent: PHI_COLORS.sunshineYellow,
  paid: PHI_COLORS.moneyGreen,
};

// Industry-average cost ratios — used only until the driver has logged real expenses,
// since PHI doesn't yet know actual fuel/maintenance/insurance spend per load.
const FUEL_COST_RATIO = 0.25;
const MAINTENANCE_COST_RATIO = 0.05;
const INSURANCE_COST_RATIO = 0.03;
const MISC_COST_RATIO = 0.04;

const groupEarningsByDay = (history: { rate: number; bookedAt: string }[]): number[] => {
  const byDay = new Map<string, number>();
  history.forEach(({ rate, bookedAt }) => {
    const day = bookedAt.split('T')[0];
    byDay.set(day, (byDay.get(day) ?? 0) + rate);
  });
  return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, total]) => total);
};

export default function EarningsScreen() {
  const navigation = useNavigation<EarningsNavigationProp>();
  const { bookingHistory, setPaymentStatus } = useLoadsStore();
  const { entries, addExpense, totalsByCategory, totalExpenses } = useExpenseStore();
  const { fullName } = useProfileStore();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleRequestPayment = async (record: typeof bookingHistory[number]): Promise<void> => {
    const message = [
      `Invoice Request — Load ${record.id}`,
      `From: ${fullName.trim() || '(driver name not set)'}`,
      `Broker: ${record.brokerName}`,
      `Miles: ${record.miles}`,
      `Rate: $${record.rate.toFixed(2)}`,
      `Booked: ${new Date(record.bookedAt).toLocaleDateString()}`,
      '',
      'Please remit payment for the above load at your earliest convenience. Thank you for your business.',
    ].join('\n');
    await Share.share({ message, title: `Invoice — Load ${record.id}` });
    setPaymentStatus(record.id, 'invoice_sent');
  };

  const handleAddExpense = (): void => {
    const parsedAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    const category = categorizeExpense({ vendor: description, description, amount: parsedAmount }) as ExpenseCategory;
    addExpense(category, parsedAmount, description.trim());
    setDescription('');
    setAmount('');
  };

  if (bookingHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No earnings yet</Text>
          <Text style={styles.emptyText}>
            Book your first load from the Loads tab and PHI will start tracking your real revenue, RPM trend, and
            profit here — no sample data, just what you actually haul.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalRevenue = bookingHistory.reduce((sum, record) => sum + record.rate, 0);
  const hasRealExpenses = entries.length > 0;
  const byCategory = totalsByCategory();

  const profit = PHI_ProfitFormula({
    revenue: totalRevenue,
    fuel: hasRealExpenses ? byCategory.Fuel : Number((totalRevenue * FUEL_COST_RATIO).toFixed(2)),
    maintenance: hasRealExpenses ? byCategory.Maintenance : Number((totalRevenue * MAINTENANCE_COST_RATIO).toFixed(2)),
    insurance: hasRealExpenses ? byCategory.Insurance : Number((totalRevenue * INSURANCE_COST_RATIO).toFixed(2)),
    expenses: hasRealExpenses
      ? Number((byCategory.Tolls + byCategory.Miscellaneous).toFixed(2))
      : Number((totalRevenue * MISC_COST_RATIO).toFixed(2)),
  });
  const dailyEarnings = groupEarningsByDay(bookingHistory);
  const projection = dailyEarnings.length > 0 ? projectYearlyRevenue(dailyEarnings) : null;
  const rpmTrend = calculateRPMTrend(
    bookingHistory.map((record) => ({ id: record.id, rpm: record.rpm, pickupDate: record.bookedAt })),
    7,
  );
  const progressPercentage = projection
    ? Math.min(100, Math.max(0, (projection.projectedRevenue / projection.targetRevenue) * 100))
    : 0;

  const handleShareReport = async (): Promise<void> => {
    const lines = [
      'PHI EARNINGS REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Loads Booked: ${bookingHistory.length}`,
      `Total Revenue: $${totalRevenue.toLocaleString()}`,
      `Operating Cost: $${profit.operatingCost.toLocaleString()}${hasRealExpenses ? ` (${entries.length} logged expenses)` : ' (estimated)'}`,
      `Net Profit: $${profit.netProfit.toLocaleString()}`,
      `Profit Margin: ${Math.round(profit.profitMargin)}%`,
      `7-Day Avg RPM: $${rpmTrend.averageRpm.toFixed(2)} (${rpmTrend.flag})`,
      projection ? `Yearly Projection: $${projection.projectedRevenue.toLocaleString()} vs $${projection.targetRevenue.toLocaleString()} target` : '',
      '',
      'EXPENSE BREAKDOWN',
      ...(entries.length === 0
        ? ['No expenses logged yet.']
        : entries.map((e) => `${e.description} (${e.category}): $${e.amount.toFixed(2)}`)),
    ].filter(Boolean);

    await Share.share({ message: lines.join('\n'), title: 'PHI Earnings Report' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>
            Net Profit ({bookingHistory.length} load{bookingHistory.length === 1 ? '' : 's'} booked) — {hasRealExpenses ? 'Actual expenses' : 'Estimated costs'}
          </Text>
          <Text style={styles.heroValue}>${profit.netProfit.toLocaleString()}</Text>
          <Text style={styles.heroSubtext}>
            Margin {Math.round(profit.profitMargin)}% • Operating cost ${profit.operatingCost.toLocaleString()}
            {hasRealExpenses ? ` (${entries.length} logged expenses)` : ''}
          </Text>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={() => void handleShareReport()}>
          <Text style={styles.shareButtonText}>📤 Share / Save Earnings Report</Text>
        </TouchableOpacity>

        {projection && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Yearly Projection</Text>
            <Text style={styles.metricText}>
              ${projection.projectedRevenue.toLocaleString()} projected vs ${projection.targetRevenue.toLocaleString()} target
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.helperText}>
              {projection.onTrack ? 'On pace for the $1.17M goal.' : `$${projection.gapToTarget.toLocaleString()} below target.`}
            </Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>RPM Trend</Text>
          <Text style={styles.metricText}>7-day average RPM: {rpmTrend.averageRpm.toFixed(2)}</Text>
          <Text style={[styles.helperText, rpmTrend.flag === 'Market Risk' && styles.riskText]}>
            {rpmTrend.flag} • {rpmTrend.trendPercentage}% vs previous period
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Log an Expense</Text>
          <Text style={styles.helperText}>
            Fuel, maintenance, insurance, tolls — logging real receipts replaces the estimate above with your true cost per mile.
          </Text>
          <View style={styles.expenseRow}>
            <TextInput
              style={[styles.expenseInput, { flex: 2 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Pilot fuel stop"
              placeholderTextColor="#7F8FB3"
            />
            <TextInput
              style={[styles.expenseInput, { flex: 1 }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="$"
              placeholderTextColor="#7F8FB3"
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.expenseAddButton} onPress={handleAddExpense}>
              <Text style={styles.expenseAddButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          {entries.slice(0, 5).map((entry) => (
            <View key={entry.id} style={styles.expenseListRow}>
              <Text style={styles.expenseListDesc}>{entry.description}</Text>
              <Text style={styles.expenseListCategory}>{entry.category}</Text>
              <Text style={styles.expenseListAmount}>${entry.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.getPaidHeaderRow}>
            <Text style={styles.sectionTitle}>Get Paid</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PayoutSettings')}>
              <Text style={styles.payoutSetupLink}>Payout Setup →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Send a professional invoice to the broker and track payment status here. Direct in-app broker payments
            aren't live yet — this sends a real invoice via email/text and lets you mark it paid once you receive it.
          </Text>
          {bookingHistory.slice(0, 8).map((record) => (
            <View key={record.id} style={styles.paymentRow}>
              <View style={styles.paymentTextWrap}>
                <Text style={styles.paymentLoadId}>{record.id} — {record.brokerName}</Text>
                <Text style={styles.paymentSub}>${record.rate.toFixed(0)} • {new Date(record.bookedAt).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.paymentBadge, { backgroundColor: PAYMENT_STATUS_COLOR[record.paymentStatus] + '33' }]}>
                <Text style={[styles.paymentBadgeText, { color: PAYMENT_STATUS_COLOR[record.paymentStatus] }]}>
                  {PAYMENT_STATUS_LABEL[record.paymentStatus]}
                </Text>
              </View>
              {record.paymentStatus === 'unpaid' && (
                <TouchableOpacity style={styles.paymentActionButton} onPress={() => void handleRequestPayment(record)}>
                  <Ionicons name="send-outline" size={14} color={PHI_COLORS.charcoalBlack} />
                </TouchableOpacity>
              )}
              {record.paymentStatus === 'invoice_sent' && (
                <TouchableOpacity style={styles.paymentActionButton} onPress={() => setPaymentStatus(record.id, 'paid')}>
                  <Ionicons name="checkmark" size={14} color={PHI_COLORS.charcoalBlack} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
  emptyState: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '900' },
  emptyText: { color: '#D7E3FF', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  heroCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 20, padding: 20 },
  heroLabel: { color: PHI_COLORS.sunshineYellow, fontWeight: '800' },
  heroValue: { color: PHI_COLORS.white, fontSize: 36, fontWeight: '900', marginTop: 8 },
  heroSubtext: { color: '#E7EEFF', marginTop: 8 },
  shareButton: { borderWidth: 1, borderColor: PHI_COLORS.sunshineYellow, padding: 12, borderRadius: 14, alignItems: 'center' },
  shareButtonText: { color: PHI_COLORS.sunshineYellow, fontWeight: '700' },
  sectionCard: { backgroundColor: PHI_COLORS.card, borderRadius: 18, padding: 18, gap: 10 },
  sectionTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800' },
  metricText: { color: PHI_COLORS.white, fontSize: 16, fontWeight: '700' },
  helperText: { color: '#D7E3FF', lineHeight: 20 },
  progressTrack: { height: 14, borderRadius: 999, backgroundColor: '#21406F', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: PHI_COLORS.moneyGreen, borderRadius: 999 },
  riskText: { color: PHI_COLORS.sunshineYellow, fontWeight: '800' },
  expenseRow: { flexDirection: 'row', gap: 8 },
  expenseInput: { backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#29508C' },
  expenseAddButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  expenseAddButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800' },
  expenseListRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#21406F' },
  expenseListDesc: { flex: 2, color: PHI_COLORS.white, fontSize: 13 },
  expenseListCategory: { flex: 1, color: '#7F9FCC', fontSize: 11 },
  expenseListAmount: { color: PHI_COLORS.moneyGreen, fontWeight: '700', fontSize: 13 },
  getPaidHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payoutSetupLink: { color: PHI_COLORS.sunshineYellow, fontSize: 12, fontWeight: '700' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#21406F' },
  paymentTextWrap: { flex: 1, flexShrink: 1 },
  paymentLoadId: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 13 },
  paymentSub: { color: '#7F9FCC', fontSize: 11, marginTop: 2 },
  paymentBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  paymentBadgeText: { fontWeight: '800', fontSize: 10 },
  paymentActionButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 8, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
