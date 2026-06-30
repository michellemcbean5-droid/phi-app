import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DriverAvailability } from '../api/samsaraConnector';
import { PHI_COLORS } from '../assets/brandColors';
import { auditDailyTransactions, DailyTransaction } from '../workers/ComplianceAuditWorker';

const hosSnapshot: DriverAvailability = {
  driverId: 'driver-001',
  availableDriveHours: 8.5,
  availableOnDutyHours: 10,
  cycleHoursRemaining: 33,
  status: 'available',
  lastUpdated: new Date().toISOString(),
};

const transactions: DailyTransaction[] = [
  { transactionId: 'txn-1', loadId: 'DAT-101', miles: 805, revenue: 2925, dutyHoursRequired: 9.8 },
  { transactionId: 'txn-2', loadId: 'TS-301', miles: 545, revenue: 1765, dutyHoursRequired: 7.2 },
];

export default function ComplianceScreen() {
  const report = useMemo(() => auditDailyTransactions(transactions, hosSnapshot), []);

  const handleGenerateAuditReport = (): void => {
    Alert.alert(
      'DOT Audit Report',
      `Safety Score: ${report.summary.safetyScore}%\nCompliant: ${report.compliant ? 'Yes' : 'No'}\nFlagged Loads: ${report.flaggedTransactions.length}\nTransactions: ${report.summary.totalTransactions}\nTotal Revenue: $${report.summary.totalRevenue}`,
      [{ text: 'OK' }],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Hours of Service</Text>
          <Text style={styles.heroMetric}>{hosSnapshot.availableDriveHours.toFixed(1)} hrs remaining</Text>
          <Text style={styles.heroSubtext}>On-duty: {hosSnapshot.availableOnDutyHours.toFixed(1)} hrs • Cycle: {hosSnapshot.cycleHoursRemaining.toFixed(1)} hrs</Text>
        </View>

        <TouchableOpacity style={styles.auditButton} onPress={handleGenerateAuditReport}>
          <Text style={styles.auditButtonText}>Generate DOT Audit Report</Text>
        </TouchableOpacity>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Audit Summary</Text>
          <Text style={styles.sectionText}>Compliant: {report.compliant ? 'Yes' : 'No'}</Text>
          <Text style={styles.sectionText}>Safety Score: {report.summary.safetyScore}%</Text>
          <Text style={styles.sectionText}>Flagged Loads: {report.flaggedTransactions.length}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Load History Ledger</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
  heroCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 18, padding: 20 },
  heroTitle: { color: PHI_COLORS.sunshineYellow, fontSize: 16, fontWeight: '700' },
  heroMetric: { color: PHI_COLORS.white, fontSize: 28, fontWeight: '800', marginTop: 8 },
  heroSubtext: { color: '#D7E3FF', marginTop: 8 },
  auditButton: { backgroundColor: PHI_COLORS.sunshineYellow, padding: 14, borderRadius: 14 },
  auditButtonText: { color: PHI_COLORS.charcoalBlack, textAlign: 'center', fontWeight: '800' },
  sectionCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10 },
  sectionTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '700' },
  sectionText: { color: '#D7E3FF', fontSize: 13 },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#21406F' },
  ledgerTitle: { color: PHI_COLORS.white, fontWeight: '700', marginBottom: 4 },
  amount: { color: PHI_COLORS.moneyGreen, fontWeight: '800' },
});
