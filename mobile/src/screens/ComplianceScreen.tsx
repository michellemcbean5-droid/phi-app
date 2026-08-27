import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DriverAvailability, fetchHOSData } from '../api/samsaraConnector';
import { PHI_COLORS } from '../assets/brandColors';
import { auditDailyTransactions, DailyTransaction, runAIComplianceAudit } from '../workers/ComplianceAuditWorker';
import useLoadsStore from '../store/loadsStore';
import useWorkerStore from '../store/workerStore';
import useProfileStore from '../store/profileStore';
import useDutyStatusStore from '../store/dutyStatusStore';
import { calculateHOSClock, DutyStatus } from '../workers/HOSClockWorker';
import { getExpirationAlerts } from '../workers/ComplianceExpirationWorker';

const DRIVER_ID = 'driver-001';
const AVG_ROAD_SPEED_MPH = 50;
const LOAD_UNLOAD_HOURS = 1;

export default function ComplianceScreen() {
  const { bookingHistory } = useLoadsStore();
  const { fullName, cdlNumber, cdlState, cdlExpiry, medicalCardExpiry, nextInspectionDue, setField } = useProfileStore();
  const expirationAlerts = useMemo(
    () => getExpirationAlerts([
      { label: 'CDL', dateISO: cdlExpiry || null },
      { label: 'Medical Card', dateISO: medicalCardExpiry || null },
      { label: 'Annual Inspection', dateISO: nextInspectionDue || null },
    ]),
    [cdlExpiry, medicalCardExpiry, nextInspectionDue],
  );
  const { events: dutyEvents, logStatus, currentStatus } = useDutyStatusStore();
  const [hosSnapshot, setHosSnapshot] = useState<DriverAvailability | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [clockTick, setClockTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setClockTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const liveClock = useMemo(() => calculateHOSClock(dutyEvents), [dutyEvents, clockTick]);
  const activeDutyStatus = currentStatus();

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

  const handleShareReport = async (): Promise<void> => {
    if (!hosSnapshot || !report) return;
    const lines = [
      'PHI DOT COMPLIANCE AUDIT REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      fullName.trim() ? `Driver: ${fullName}${cdlNumber ? ` (CDL ${cdlState || '??'} ${cdlNumber})` : ''}` : '',
      '',
      `Compliant: ${report.compliant ? 'Yes' : 'No'}`,
      `Safety Score: ${report.summary.safetyScore}%`,
      `Flagged Loads: ${report.flaggedTransactions.length}`,
      report.aiRiskSummary ? `\nRisk Summary:\n${report.aiRiskSummary}` : '',
      aiRecommendations.length > 0 ? `\nRecommendations:\n${aiRecommendations.map((r) => `- ${r}`).join('\n')}` : '',
      '',
      'HOURS OF SERVICE',
      `Drive hours remaining: ${hosSnapshot.availableDriveHours.toFixed(1)}`,
      `On-duty hours remaining: ${hosSnapshot.availableOnDutyHours.toFixed(1)}`,
      `70-hr cycle remaining: ${hosSnapshot.cycleHoursRemaining.toFixed(1)}`,
      '',
      'LOAD HISTORY LEDGER',
      ...(transactions.length === 0
        ? ['No loads booked yet.']
        : transactions.map((t) => `${t.loadId}: ${t.miles} mi, ${t.dutyHoursRequired.toFixed(1)} duty hrs, $${t.revenue.toFixed(0)}`)),
    ].filter(Boolean);

    await Share.share({ message: lines.join('\n'), title: 'PHI DOT Compliance Audit Report' });
  };

  if (!hosSnapshot || !report) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={PHI_COLORS.sunshineYellow} />
          <Text style={styles.loadingText}>Loading HOS data from GPS...</Text>
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

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Live HOS Clock</Text>
          <Text style={styles.sectionText}>Log your duty status as it changes — the clock tracks your real 11-hour drive limit and 14-hour window, and warns you the moment a 30-minute break is required.</Text>
          <View style={styles.dutyButtonRow}>
            {(['driving', 'on-duty-not-driving', 'off-duty', 'sleeper-berth'] as DutyStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.dutyButton, activeDutyStatus === status && styles.dutyButtonActive]}
                onPress={() => logStatus(status)}
              >
                <Text style={[styles.dutyButtonText, activeDutyStatus === status && styles.dutyButtonTextActive]}>
                  {status === 'on-duty-not-driving' ? 'On-Duty' : status === 'off-duty' ? 'Off-Duty' : status === 'sleeper-berth' ? 'Sleeper' : 'Driving'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {dutyEvents.length === 0 ? (
            <Text style={styles.sectionText}>No duty status logged yet today — tap a button above to start the clock.</Text>
          ) : (
            <>
              <View style={styles.clockRow}>
                <Text style={styles.sectionText}>Drive time used: <Text style={styles.clockValue}>{liveClock.driveHoursUsed}h</Text> of 11h</Text>
                <Text style={styles.sectionText}>On-duty window: <Text style={styles.clockValue}>{liveClock.onDutyWindowHoursUsed}h</Text> of 14h</Text>
              </View>
              {liveClock.breakRequired && (
                <Text style={styles.hosWarning}>⚠️ {liveClock.hoursSinceLastQualifyingBreak}h driven since your last qualifying break — a 30-minute break is required before driving further.</Text>
              )}
              {liveClock.driveHoursRemaining <= 0 && <Text style={styles.hosWarning}>⚠️ 11-hour drive limit reached.</Text>}
              {liveClock.onDutyWindowHoursRemaining <= 0 && <Text style={styles.hosWarning}>⚠️ 14-hour on-duty window expired.</Text>}
              {liveClock.splitSleeperBerthDetected && (
                <Text style={styles.hosNote}>Split sleeper-berth pattern detected — this is a conservative estimate that doesn't apply the split exception, so your real remaining hours may be higher. Verify against your ELD.</Text>
              )}
            </>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Expiration Tracker</Text>
          <Text style={styles.sectionText}>Set these once — PHI flags anything expiring within 30 days before it puts you out of service at a roadside check.</Text>

          <Text style={styles.expiryLabel}>CDL Expiration (YYYY-MM-DD)</Text>
          <TextInput style={styles.expiryInput} value={cdlExpiry} onChangeText={(v) => setField('cdlExpiry', v)} placeholder="2027-06-01" placeholderTextColor="#7F8FB3" />

          <Text style={styles.expiryLabel}>Medical Card Expiration (YYYY-MM-DD)</Text>
          <TextInput style={styles.expiryInput} value={medicalCardExpiry} onChangeText={(v) => setField('medicalCardExpiry', v)} placeholder="2026-12-01" placeholderTextColor="#7F8FB3" />

          <Text style={styles.expiryLabel}>Next Annual Inspection Due (YYYY-MM-DD)</Text>
          <TextInput style={styles.expiryInput} value={nextInspectionDue} onChangeText={(v) => setField('nextInspectionDue', v)} placeholder="2026-09-15" placeholderTextColor="#7F8FB3" />

          {expirationAlerts.map((alert) => (
            <Text
              key={alert.label}
              style={alert.urgency === 'expired' ? styles.expiryExpired : alert.urgency === 'expiring-soon' ? styles.expiryWarning : styles.expiryOk}
            >
              {alert.urgency === 'expired'
                ? `🚫 ${alert.label} expired ${Math.abs(alert.daysRemaining)} day${Math.abs(alert.daysRemaining) === 1 ? '' : 's'} ago`
                : alert.urgency === 'expiring-soon'
                  ? `⚠️ ${alert.label} expires in ${alert.daysRemaining} day${alert.daysRemaining === 1 ? '' : 's'}`
                  : `✅ ${alert.label} good until ${alert.dateISO.split('T')[0]}`}
            </Text>
          ))}
        </View>

        <TouchableOpacity style={styles.auditButton} onPress={() => void handleGenerateAuditReport()} disabled={auditLoading}>
          {auditLoading ? (
            <ActivityIndicator color={PHI_COLORS.charcoalBlack} />
          ) : (
            <Text style={styles.auditButtonText}>Generate AI DOT Audit Report</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={() => void handleShareReport()}>
          <Text style={styles.shareButtonText}>📤 Share / Save Report</Text>
        </TouchableOpacity>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Audit Summary</Text>
          <Text style={styles.sectionText}>Compliant: {report.compliant ? '✅ Yes' : '❌ No'}</Text>
          <Text style={styles.sectionText}>Safety Score: {report.summary.safetyScore}%</Text>
          <Text style={styles.sectionText}>Flagged Loads: {report.flaggedTransactions.length}</Text>
          {report.aiRiskSummary ? (
            <Text style={styles.riskSummaryText}>{report.aiRiskSummary}</Text>
          ) : null}
        </View>

        {aiRecommendations.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            {aiRecommendations.map((rec, i) => (
              <Text key={i} style={styles.recommendationText}>• {rec}</Text>
            ))}
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Load History Ledger</Text>
          {transactions.length === 0 && (
            <Text style={styles.sectionText}>No loads booked yet — book a load from the Loads tab to start tracking duty hours here.</Text>
          )}
          {transactions.map((transaction) => (
            <View key={transaction.transactionId} style={styles.ledgerRow}>
              <View style={styles.ledgerTextWrap}>
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
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: PHI_COLORS.white, fontSize: 14 },
  content: { padding: 16, gap: 16 },
  heroCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 18, padding: 20, gap: 8 },
  heroTitle: { color: PHI_COLORS.sunshineYellow, fontSize: 16, fontWeight: '700' },
  heroMetric: { fontSize: 28, fontWeight: '800' },
  heroSubtext: { color: '#D7E3FF' },
  locationText: { color: '#A8B7D8', fontSize: 13 },
  statusChip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  statusChipText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 11 },
  auditButton: { backgroundColor: PHI_COLORS.sunshineYellow, padding: 14, borderRadius: 14, alignItems: 'center' },
  shareButton: { borderWidth: 1, borderColor: PHI_COLORS.sunshineYellow, padding: 12, borderRadius: 14, alignItems: 'center' },
  shareButtonText: { color: PHI_COLORS.sunshineYellow, fontWeight: '700' },
  auditButtonText: { color: PHI_COLORS.charcoalBlack, textAlign: 'center', fontWeight: '800' },
  sectionCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10 },
  sectionTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '700' },
  sectionText: { color: '#D7E3FF', fontSize: 13 },
  riskSummaryText: { color: '#B0C8FF', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  recommendationText: { color: PHI_COLORS.moneyGreen, fontSize: 13, lineHeight: 20 },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#21406F' },
  ledgerTextWrap: { flex: 1, flexShrink: 1 },
  ledgerTitle: { color: PHI_COLORS.white, fontWeight: '700', marginBottom: 4 },
  amount: { color: PHI_COLORS.moneyGreen, fontWeight: '800' },
  dutyButtonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dutyButton: { flexGrow: 1, backgroundColor: PHI_COLORS.surface, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2A3A5C' },
  dutyButtonActive: { backgroundColor: PHI_COLORS.sunshineYellow, borderColor: PHI_COLORS.sunshineYellow },
  dutyButtonText: { color: PHI_COLORS.white, fontSize: 12, fontWeight: '700' },
  dutyButtonTextActive: { color: PHI_COLORS.charcoalBlack },
  clockRow: { gap: 4 },
  clockValue: { color: PHI_COLORS.white, fontWeight: '800' },
  hosWarning: { color: '#FF6B6B', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  hosNote: { color: '#A8B7D8', fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
  expiryLabel: { color: '#A8B7D8', fontSize: 12, fontWeight: '700', marginTop: 6 },
  expiryInput: { backgroundColor: PHI_COLORS.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#2A3A5C', marginTop: 4 },
  expiryOk: { color: PHI_COLORS.moneyGreen, fontSize: 12, marginTop: 8 },
  expiryWarning: { color: PHI_COLORS.sunshineYellow, fontSize: 12, fontWeight: '700', marginTop: 8 },
  expiryExpired: { color: '#FF5252', fontSize: 12, fontWeight: '800', marginTop: 8 },
});
