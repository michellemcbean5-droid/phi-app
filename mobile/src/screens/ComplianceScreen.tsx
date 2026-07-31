import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DriverAvailability, fetchHOSData } from '../api/samsaraConnector';
import { PHI_COLORS } from '../assets/brandColors';
import { auditDailyTransactions, DailyTransaction, runAIComplianceAudit } from '../workers/ComplianceAuditWorker';
import useLoadsStore from '../store/loadsStore';
import useWorkerStore from '../store/workerStore';
import BouncyButton from '../components/animations/BouncyButton';
import SkeletonShimmer from '../components/animations/SkeletonShimmer';
import StaggeredEntrance from '../components/animations/StaggeredEntrance';

const DRIVER_ID = 'driver-001';
const AVG_ROAD_SPEED_MPH = 50;
const LOAD_UNLOAD_HOURS = 1;

export default function ComplianceScreen() {
  const { bookingHistory } = useLoadsStore();
  const [hosSnapshot, setHosSnapshot] = useState<DriverAvailability | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);

  const transactions: DailyTransaction[] = useMemo(
    () =>
      bookingHistory.map((record) => ({
        transactionId: record.id,
        loadId: record.id,
        miles: record.miles,
        revenue: record.rate,
        dutyHoursRequired: Number((record.miles / AVG_ROAD_SPEED_MPH + LOAD_UNLOAD_HOURS).toFixed(1)),
      })),
    [bookingHistory],
  );

  useEffect(() => {
    void fetchHOSData(DRIVER_ID).then(setHosSnapshot).catch(() => {
      setHosSnapshot({
        driverId: DRIVER_ID,
        availableDriveHours: 8.5,
        availableOnDutyHours: 10,
        cycleHoursRemaining: 33,
        status: 'available',
        lastUpdated: new Date().toISOString(),
      });
    });
  }, []);

  const report = useMemo(() => {
    if (!hosSnapshot) return null;
    return auditDailyTransactions(transactions, hosSnapshot);
  }, [hosSnapshot, transactions]);

  const handleGenerateAuditReport = async (): Promise<void> => {
    if (!hosSnapshot) return;
    setAuditLoading(true);
    try {
      const aiReport = await runAIComplianceAudit(transactions, hosSnapshot);
      setAiRecommendations(aiReport.recommendations);
      useWorkerStore.getState().recordTaskCompletion('compliance-safety', 0, `Ran a DOT audit — safety score ${aiReport.summary.safetyScore}%`);
      Alert.alert(
        'DOT Audit Report',
        `Safety Score: ${aiReport.summary.safetyScore}%\nCompliant: ${aiReport.compliant ? 'Yes' : 'No'}\nFlagged Loads: ${aiReport.flaggedTransactions.length}\n\n${aiReport.aiRiskSummary}`,
        [{ text: 'OK' }],
      );
    } catch {
      if (report) {
        Alert.alert(
          'DOT Audit Report',
          `Safety Score: ${report.summary.safetyScore}%\nCompliant: ${report.compliant ? 'Yes' : 'No'}\nFlagged Loads: ${report.flaggedTransactions.length}`,
          [{ text: 'OK' }],
        );
      }
    } finally {
      setAuditLoading(false);
    }
  };

  if (!hosSnapshot || !report) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.skeletonContent}>
          <SkeletonShimmer style={styles.skeletonHero} />
          <SkeletonShimmer style={styles.skeletonButton} />
          <SkeletonShimmer style={styles.skeletonCard} />
          <SkeletonShimmer style={styles.skeletonCard} />
        </View>
      </SafeAreaView>
    );
  }

  const hosStatusColor =
    hosSnapshot.status === 'out-of-hours'
      ? '#FF5252'
      : hosSnapshot.status === 'limited'
        ? PHI_COLORS.sunshineYellow
        : PHI_COLORS.moneyGreen;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <StaggeredEntrance index={0}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Hours of Service</Text>
          <Text style={[styles.heroMetric, { color: hosStatusColor }]}>
            {hosSnapshot.availableDriveHours.toFixed(1)} hrs drive remaining
          </Text>
          <Text style={styles.heroSubtext}>
            On-duty: {hosSnapshot.availableOnDutyHours.toFixed(1)} hrs • Cycle: {hosSnapshot.cycleHoursRemaining.toFixed(1)} hrs
          </Text>
          {hosSnapshot.currentLocation?.city ? (
            <Text style={styles.locationText}>📍 {hosSnapshot.currentLocation.city}</Text>
          ) : null}
          <View style={[styles.statusChip, { backgroundColor: hosStatusColor }]}>
            <Text style={styles.statusChipText}>{hosSnapshot.status.replace(/-/g, ' ').toUpperCase()}</Text>
          </View>
        </View>
        </StaggeredEntrance>

        <StaggeredEntrance index={1}>
        <BouncyButton
          onPress={() => void handleGenerateAuditReport()}
          disabled={auditLoading}
          backgroundColor={PHI_COLORS.sunshineYellow}
          size="md"
        >
          {auditLoading ? (
            <ActivityIndicator color={PHI_COLORS.charcoalBlack} />
          ) : (
            <Text style={styles.auditButtonText}>Generate AI DOT Audit Report</Text>
          )}
        </BouncyButton>
        </StaggeredEntrance>

        <StaggeredEntrance index={2}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Audit Summary</Text>
          <Text style={styles.sectionText}>Compliant: {report.compliant ? '✅ Yes' : '❌ No'}</Text>
          <Text style={styles.sectionText}>Safety Score: {report.summary.safetyScore}%</Text>
          <Text style={styles.sectionText}>Flagged Loads: {report.flaggedTransactions.length}</Text>
          {report.aiRiskSummary ? (
            <Text style={styles.riskSummaryText}>{report.aiRiskSummary}</Text>
          ) : null}
        </View>
        </StaggeredEntrance>

        {aiRecommendations.length > 0 && (
          <StaggeredEntrance index={3}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            {aiRecommendations.map((rec, i) => (
              <Text key={i} style={styles.recommendationText}>• {rec}</Text>
            ))}
          </View>
          </StaggeredEntrance>
        )}

        <StaggeredEntrance index={4}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Load History Ledger</Text>
          {transactions.length === 0 && (
            <Text style={styles.sectionText}>No loads booked yet — book a load from the Loads tab to start tracking duty hours here.</Text>
          )}
          {transactions.map((transaction) => (
            <View key={transaction.transactionId} style={styles.ledgerRow}>
              <View>
                <Text style={styles.ledgerTitle}>{transaction.loadId}</Text>
                <Text style={styles.sectionText}>{transaction.miles} mi • {transaction.dutyHoursRequired.toFixed(1)} duty hrs</Text>
              </View>
              <Text style={styles.amount}>${transaction.revenue.toFixed(0)}</Text>
            </View>
          ))}
        </View>
        </StaggeredEntrance>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  skeletonContent: { flex: 1, padding: 16, gap: 16 },
  skeletonHero: { height: 150, borderRadius: 18 },
  skeletonButton: { height: 50, borderRadius: 14 },
  skeletonCard: { height: 120, borderRadius: 16 },
  content: { padding: 16, gap: 16 },
  heroCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 18, padding: 20, gap: 8 },
  heroTitle: { color: PHI_COLORS.sunshineYellow, fontSize: 16, fontWeight: '700' },
  heroMetric: { fontSize: 28, fontWeight: '800' },
  heroSubtext: { color: '#D7E3FF' },
  locationText: { color: '#A8B7D8', fontSize: 13 },
  statusChip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  statusChipText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 11 },
  auditButton: { backgroundColor: PHI_COLORS.sunshineYellow, padding: 14, borderRadius: 14, alignItems: 'center' },
  auditButtonText: { color: PHI_COLORS.charcoalBlack, textAlign: 'center', fontWeight: '800' },
  sectionCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10 },
  sectionTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '700' },
  sectionText: { color: '#D7E3FF', fontSize: 13 },
  riskSummaryText: { color: '#B0C8FF', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  recommendationText: { color: PHI_COLORS.moneyGreen, fontSize: 13, lineHeight: 20 },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#21406F' },
  ledgerTitle: { color: PHI_COLORS.white, fontWeight: '700', marginBottom: 4 },
  amount: { color: PHI_COLORS.moneyGreen, fontWeight: '800' },
});
