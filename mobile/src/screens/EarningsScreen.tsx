import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHI_COLORS } from '../assets/brandColors';
import useLoadsStore from '../store/loadsStore';
import { calculateRPMTrend, PHI_ProfitFormula, projectYearlyRevenue } from '../utils/profitFormula';

// Industry-average cost ratios applied to real booked revenue since PHI does not
// yet capture actual fuel/maintenance/insurance receipts per load.
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
  const { bookingHistory } = useLoadsStore();

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
  const profit = PHI_ProfitFormula({
    revenue: totalRevenue,
    fuel: Number((totalRevenue * FUEL_COST_RATIO).toFixed(2)),
    maintenance: Number((totalRevenue * MAINTENANCE_COST_RATIO).toFixed(2)),
    insurance: Number((totalRevenue * INSURANCE_COST_RATIO).toFixed(2)),
    expenses: Number((totalRevenue * MISC_COST_RATIO).toFixed(2)),
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Net Profit ({bookingHistory.length} loads booked)</Text>
          <Text style={styles.heroValue}>${profit.netProfit.toLocaleString()}</Text>
          <Text style={styles.heroSubtext}>
            Margin {Math.round(profit.profitMargin)}% • Est. operating cost ${profit.operatingCost.toLocaleString()}
          </Text>
        </View>

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
  sectionCard: { backgroundColor: PHI_COLORS.card, borderRadius: 18, padding: 18, gap: 10 },
  sectionTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800' },
  metricText: { color: PHI_COLORS.white, fontSize: 16, fontWeight: '700' },
  helperText: { color: '#D7E3FF', lineHeight: 20 },
  progressTrack: { height: 14, borderRadius: 999, backgroundColor: '#21406F', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: PHI_COLORS.moneyGreen, borderRadius: 999 },
  riskText: { color: PHI_COLORS.sunshineYellow, fontWeight: '800' },
});
