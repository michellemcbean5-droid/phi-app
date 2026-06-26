import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHI_COLORS } from '../assets/brandColors';
import { trackReferral } from '../utils/affiliateTracker';
import { calculateRPMTrend, PHI_ProfitFormula, projectYearlyRevenue } from '../utils/profitFormula';

const dailyEarnings = [4200, 4385, 4510, 4725, 4852, 4660, 4910];
const rpmLoads = [
  { id: 'load-1', rpm: 3.8, pickupDate: '2025-06-18' },
  { id: 'load-2', rpm: 3.6, pickupDate: '2025-06-19' },
  { id: 'load-3', rpm: 3.25, pickupDate: '2025-06-20' },
  { id: 'load-4', rpm: 3.15, pickupDate: '2025-06-21' },
  { id: 'load-5', rpm: 3.05, pickupDate: '2025-06-22' },
  { id: 'load-6', rpm: 2.95, pickupDate: '2025-06-23' },
  { id: 'load-7', rpm: 2.88, pickupDate: '2025-06-24' },
  { id: 'load-8', rpm: 2.72, pickupDate: '2025-06-25' },
  { id: 'load-9', rpm: 2.65, pickupDate: '2025-06-26' },
];

export default function EarningsScreen() {
  const totalRevenue = dailyEarnings.reduce((sum, value) => sum + value, 0);
  const profit = PHI_ProfitFormula({
    revenue: totalRevenue,
    fuel: 6250,
    maintenance: 1150,
    insurance: 750,
    expenses: 900,
  });
  const projection = projectYearlyRevenue(dailyEarnings);
  const rpmTrend = calculateRPMTrend(rpmLoads, 7);
  const affiliate = trackReferral('ref-phi-01', 6400);
  const progressPercentage = Math.min(100, Math.max(0, (projection.projectedRevenue / projection.targetRevenue) * 100));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Live Net Profit</Text>
          <Text style={styles.heroValue}>${profit.netProfit.toLocaleString()}</Text>
          <Text style={styles.heroSubtext}>Margin {profit.profitMargin}% • Operating cost ${profit.operatingCost.toLocaleString()}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Yearly Projection</Text>
          <Text style={styles.metricText}>${projection.projectedRevenue.toLocaleString()} projected vs ${projection.targetRevenue.toLocaleString()} target</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.helperText}>{projection.onTrack ? 'On pace for the $1.17M goal.' : `$${projection.gapToTarget.toLocaleString()} below target.`}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>RPM Trend</Text>
          <Text style={styles.metricText}>7-day average RPM: {rpmTrend.averageRpm.toFixed(2)}</Text>
          <Text style={[styles.helperText, rpmTrend.flag === 'Market Risk' && styles.riskText]}>{rpmTrend.flag} • {rpmTrend.trendPercentage}% vs previous period</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Affiliate Commission Earned</Text>
          <Text style={styles.metricText}>${affiliate.commissionAmount.toFixed(2)}</Text>
          <Text style={styles.helperText}>Tracked on referral {affiliate.trackingRecord.referralId}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
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
