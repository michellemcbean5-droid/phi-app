import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import useLoadsStore, { GateEvent } from '../store/loadsStore';
import useDriverPrefsStore from '../store/driverPrefsStore';
import { Load } from '../workers/workers-15x';
import { summarizeLoadDetention } from '../workers/DetentionTrackerWorker';
import { findBackhauls } from '../workers/BackhaulPlannerWorker';
import { filterUpcomingLoads } from '../workers/NextDayPlannerWorker';
import { evaluateCheckCallStatus } from '../workers/CheckCallWorker';
import { evaluateTONUEligibility } from '../workers/TONUWorker';
import { benchmarkLoadRate } from '../workers/LaneRateBenchmarkWorker';
import { verifyFuelSurcharge } from '../workers/FuelSurchargeWorker';
import { fetchLiveDieselPrice } from '../utils/fuelOptimizer';
import { AccessorialType, STANDARD_ACCESSORIAL_RATES, totalAccessorialCharges } from '../workers/AccessorialWorker';
import { sendCheckCallUpdate } from '../api/twilioConnector';
import usePHIOrchestratorStore from '../store/phiOrchestratorStore';

type Props = NativeStackScreenProps<RootStackParamList, 'LoadDetails'>;

interface LoadDetailRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const GATE_STOPS: { checkIn: GateEvent; checkOut: GateEvent; label: string }[] = [
  { checkIn: 'pickupCheckIn', checkOut: 'pickupCheckOut', label: 'Pickup' },
  { checkIn: 'deliveryCheckIn', checkOut: 'deliveryCheckOut', label: 'Delivery' },
];

export default function LoadDetailsScreen({ route, navigation }: Props) {
  const { activeLoads, bookingHistory, logGateEvent, bookingState, setBookingState, logCheckCall, logAccessorialCharge } = useLoadsStore();
  const { prefs } = useDriverPrefsStore();
  const { log: orchestratorLog } = usePHIOrchestratorStore();
  const loadId = route.params.loadId;
  const [dieselPrice, setDieselPrice] = useState<number | null>(null);
  const [quotedFSCInput, setQuotedFSCInput] = useState('');

  useEffect(() => {
    void fetchLiveDieselPrice().then((price) => setDieselPrice(price.nationalAverage));
  }, []);

  // Find the load from activeLoads
  const load = activeLoads.find(l => l.id === loadId);
  const bookedRecord = bookingHistory.find((r) => r.id === loadId);

  if (!load) return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.row}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Load not found.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const benchmark = benchmarkLoadRate(load, activeLoads.filter((l) => l.id !== load.id));

  const rows: LoadDetailRow[] = [
    { icon: 'location-outline', label: 'Origin', value: `${load.origin.city}, ${load.origin.state}` },
    { icon: 'flag-outline', label: 'Destination', value: `${load.destination.city}, ${load.destination.state}` },
    { icon: 'speedometer-outline', label: 'Miles', value: `${load.miles} mi` },
    { icon: 'scale-outline', label: 'Weight', value: `${load.weightLbs} lbs` },
    { icon: 'cube-outline', label: 'Equipment', value: load.equipmentType },
    { icon: 'cash-outline', label: 'Rate', value: `$${load.rate.toFixed(2)}` },
    { icon: 'cash-outline', label: 'RPM', value: `$${load.rpm.toFixed(2)}` },
    ...(benchmark.sampleSize > 0
      ? [{
          icon: 'stats-chart-outline' as const,
          label: `vs. ${load.equipmentType} Board Avg`,
          value: `${benchmark.percentVsAverage > 0 ? '+' : ''}${benchmark.percentVsAverage.toFixed(0)}% (${benchmark.classification.replace('-', ' ')})`,
        }]
      : []),
    { icon: 'time-outline', label: 'Pickup Date', value: load.pickupDate },
    { icon: 'checkmark-circle-outline', label: 'Delivery Date', value: load.deliveryDate },
    { icon: 'business-outline', label: 'Broker', value: load.brokerName },
    { icon: 'star-outline', label: 'Broker Rating', value: `${load.brokerRating.toFixed(1)}/5.0` },
    { icon: 'pulse-outline', label: 'Source', value: load.source },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <Text style={styles.loadId}>{load.id}</Text>
          <Text style={styles.status}>Status: Available</Text>
        </View>
        
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Ionicons name={r.icon} size={20} color={PHI_COLORS.sunshineYellow} style={{ width: 28 }} />
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.value}>{r.value}</Text>
          </View>
        ))}

        <View style={styles.detentionCard}>
          <Text style={styles.detentionTitle}>Fuel Surcharge Checker</Text>
          <Text style={styles.detentionSubtitle}>
            {dieselPrice
              ? `Verify the broker's quoted FSC against a fair calculation using today's $${dieselPrice.toFixed(2)}/gal national diesel average.`
              : 'Loading current diesel price...'}
          </Text>
          <TextInput
            style={styles.fscInput}
            value={quotedFSCInput}
            onChangeText={setQuotedFSCInput}
            placeholder="Broker's quoted FSC ($)"
            placeholderTextColor="#7F8FB3"
            keyboardType="numeric"
          />
          {dieselPrice && quotedFSCInput.trim().length > 0 && !Number.isNaN(Number(quotedFSCInput)) && (() => {
            const result = verifyFuelSurcharge({
              currentDieselPricePerGallon: dieselPrice,
              baselineDieselPricePerGallon: prefs.fscBaselineDieselPrice,
              truckMPG: prefs.truckMPG,
              tripMiles: load.totalMiles,
              quotedFSC: Number(quotedFSCInput),
            });
            return (
              <Text style={result.isFair ? styles.fscFair : styles.fscUnfair}>
                {result.isFair
                  ? `✅ Fair — a fully fair FSC for this trip is about $${result.fairFSCTotal.toFixed(2)} ($${result.fairFSCPerMile.toFixed(3)}/mi).`
                  : `⚠️ Short by $${result.shortfall.toFixed(2)} — fair FSC for this trip is about $${result.fairFSCTotal.toFixed(2)} ($${result.fairFSCPerMile.toFixed(3)}/mi), not $${Number(quotedFSCInput).toFixed(2)}.`}
              </Text>
            );
          })()}
        </View>

        {bookedRecord && (
          <View style={styles.detentionCard}>
            <Text style={styles.detentionTitle}>Gate Check-In / Detention Tracker</Text>
            <Text style={styles.detentionSubtitle}>
              First {prefs.detentionFreeTimeHours}h free at each stop, then ${prefs.detentionRatePerHour}/hr detention.
            </Text>
            {GATE_STOPS.map(({ checkIn, checkOut, label }) => {
              const checkInTime = bookedRecord.gateTimes?.[checkIn];
              const checkOutTime = bookedRecord.gateTimes?.[checkOut];
              const summary = summarizeLoadDetention(bookedRecord.gateTimes ?? {}, prefs.detentionFreeTimeHours, prefs.detentionRatePerHour);
              const stopResult = summary.stops.find((s) => s.stop === label.toLowerCase())?.result;
              return (
                <View key={label} style={styles.stopBlock}>
                  <Text style={styles.stopLabel}>{label}</Text>
                  <View style={styles.gateButtonRow}>
                    <Pressable
                      style={[styles.gateButton, checkInTime && styles.gateButtonDone]}
                      disabled={!!checkInTime}
                      onPress={() => logGateEvent(bookedRecord.id, checkIn, new Date().toISOString())}
                    >
                      <Text style={styles.gateButtonText}>{checkInTime ? `In: ${new Date(checkInTime).toLocaleTimeString()}` : 'Check In'}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.gateButton, (!checkInTime || checkOutTime) && styles.gateButtonDisabled, checkOutTime && styles.gateButtonDone]}
                      disabled={!checkInTime || !!checkOutTime}
                      onPress={() => logGateEvent(bookedRecord.id, checkOut, new Date().toISOString())}
                    >
                      <Text style={styles.gateButtonText}>{checkOutTime ? `Out: ${new Date(checkOutTime).toLocaleTimeString()}` : 'Check Out'}</Text>
                    </Pressable>
                  </View>
                  {stopResult?.isComplete && (
                    <Text style={styles.detentionResult}>
                      {stopResult.totalMinutesOnSite} min on site · {stopResult.detentionMinutes} min billable
                      {stopResult.detentionOwed > 0 ? ` · $${stopResult.detentionOwed.toFixed(2)} detention owed` : ' · within free time'}
                    </Text>
                  )}
                </View>
              );
            })}
            {(() => {
              const summary = summarizeLoadDetention(bookedRecord.gateTimes ?? {}, prefs.detentionFreeTimeHours, prefs.detentionRatePerHour);
              return summary.totalDetentionOwed > 0 ? (
                <Text style={styles.totalDetention}>Total detention owed: ${summary.totalDetentionOwed.toFixed(2)}</Text>
              ) : null;
            })()}
          </View>
        )}

        {bookedRecord && (
          <View style={styles.detentionCard}>
            <Text style={styles.detentionTitle}>Accessorial Charges</Text>
            <Text style={styles.detentionSubtitle}>Log extra work you actually did on this load — it gets billed, not absorbed for free.</Text>
            <View style={styles.accessorialButtonRow}>
              {(Object.keys(STANDARD_ACCESSORIAL_RATES) as AccessorialType[]).map((type) => (
                <Pressable
                  key={type}
                  style={styles.accessorialButton}
                  onPress={() => logAccessorialCharge(bookedRecord.id, { type, amount: STANDARD_ACCESSORIAL_RATES[type], loggedAt: new Date().toISOString() })}
                >
                  <Text style={styles.accessorialButtonText}>+ {type} (${STANDARD_ACCESSORIAL_RATES[type]})</Text>
                </Pressable>
              ))}
            </View>
            {(bookedRecord.accessorialCharges ?? []).length > 0 && (
              <>
                {(bookedRecord.accessorialCharges ?? []).map((charge, index) => (
                  <Text key={index} style={styles.detentionResult}>{charge.type} — ${charge.amount.toFixed(2)} at {new Date(charge.loggedAt).toLocaleTimeString()}</Text>
                ))}
                <Text style={styles.totalDetention}>Total accessorial: ${totalAccessorialCharges(bookedRecord.accessorialCharges ?? []).toFixed(2)}</Text>
              </>
            )}
          </View>
        )}

        {bookedRecord && bookingState[load.id] === 'booked' && (() => {
          const checkCall = evaluateCheckCallStatus({
            bookedAtISO: bookedRecord.bookedAt,
            deliveredAtISO: bookedRecord.gateTimes?.deliveryCheckOut ?? null,
            checkCallLog: bookedRecord.checkCallLog ?? [],
            intervalHours: 4,
          });
          if (!checkCall.inTransit) return null;
          return (
            <View style={styles.detentionCard}>
              <Text style={styles.detentionTitle}>Broker Check Calls</Text>
              <Text style={styles.detentionSubtitle}>
                Automated status updates every 4 hours in transit — no need to call the broker yourself.
              </Text>
              <Text style={styles.detentionResult}>
                {checkCall.lastCheckCallISO ? `Last sent: ${new Date(checkCall.lastCheckCallISO).toLocaleTimeString()}` : 'No check call sent yet.'}
              </Text>
              <Pressable
                style={[styles.gateButton, checkCall.isDue && styles.gateButtonDone, { marginTop: 10 }]}
                onPress={() => {
                  const now = new Date().toISOString();
                  logCheckCall(bookedRecord.id, now);
                  void sendCheckCallUpdate(load.id, load.brokerName, load.origin.city);
                }}
              >
                <Text style={styles.gateButtonText}>{checkCall.isDue ? '📞 Check Call Due — Send Now' : '📞 Send Check Call'}</Text>
              </Pressable>
            </View>
          );
        })()}

        {bookedRecord && (() => {
          const suggestions = findBackhauls(load.destination, activeLoads, load.id, { minRPM: prefs.minRPM }).slice(0, 3);
          if (suggestions.length === 0) return null;
          return (
            <View style={styles.detentionCard}>
              <Text style={styles.detentionTitle}>Backhaul Suggestions</Text>
              <Text style={styles.detentionSubtitle}>
                Loads originating near {load.destination.city}, {load.destination.state} — avoid running empty on the way back.
              </Text>
              {suggestions.map((s) => (
                <Pressable
                  key={s.load.id}
                  style={styles.backhaulRow}
                  onPress={() => navigation.push('LoadDetails', { loadId: s.load.id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.backhaulLane}>
                      {s.load.origin.city}, {s.load.origin.state} → {s.load.destination.city}, {s.load.destination.state}
                    </Text>
                    <Text style={styles.backhaulMeta}>{s.distanceFromDropMiles.toFixed(0)} mi away · ${s.load.rate.toFixed(0)} · {s.load.rpm.toFixed(2)} RPM</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={PHI_COLORS.sunshineYellow} />
                </Pressable>
              ))}
            </View>
          );
        })()}

        {bookedRecord && (() => {
          const upcoming = filterUpcomingLoads(activeLoads, load.deliveryDate);
          const suggestions = findBackhauls(load.destination, upcoming, load.id, { minRPM: prefs.minRPM }).slice(0, 3);
          if (suggestions.length === 0) return null;
          return (
            <View style={styles.detentionCard}>
              <Text style={styles.detentionTitle}>Next-Day Load Options</Text>
              <Text style={styles.detentionSubtitle}>
                Lined up before you even deliver — loads that pick up on or after {load.deliveryDate}.
              </Text>
              {suggestions.map((s) => (
                <Pressable
                  key={s.load.id}
                  style={styles.backhaulRow}
                  onPress={() => navigation.push('LoadDetails', { loadId: s.load.id })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.backhaulLane}>
                      {s.load.origin.city}, {s.load.origin.state} → {s.load.destination.city}, {s.load.destination.state}
                    </Text>
                    <Text style={styles.backhaulMeta}>Pickup {s.load.pickupDate} · ${s.load.rate.toFixed(0)} · {s.load.rpm.toFixed(2)} RPM</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={PHI_COLORS.sunshineYellow} />
                </Pressable>
              ))}
            </View>
          );
        })()}

        {bookedRecord && bookingState[load.id] === 'booked' && (
          <Pressable
            style={styles.cancelButton}
            onPress={() => setBookingState(load.id, 'cancelled')}
          >
            <Ionicons name="warning-outline" size={16} color="#FF6B6B" style={{ marginRight: 6 }} />
            <Text style={styles.cancelButtonText}>Broker Cancelled This Load</Text>
          </Pressable>
        )}

        {bookedRecord && bookingState[load.id] === 'cancelled' && (() => {
          const suggestions = findBackhauls(load.origin, activeLoads, load.id, {}).slice(0, 3);
          return (
            <View style={[styles.detentionCard, styles.emergencyCard]}>
              <Text style={styles.emergencyTitle}>⚠️ Load Cancelled — Emergency Re-Dispatch</Text>
              <Text style={styles.detentionSubtitle}>
                {load.brokerName} cancelled this load. Here's what's available near {load.origin.city}, {load.origin.state} right now.
              </Text>
              {suggestions.length === 0 ? (
                <Text style={styles.detentionResult}>No nearby replacement loads found yet — pull to refresh the load board.</Text>
              ) : (
                suggestions.map((s) => (
                  <Pressable
                    key={s.load.id}
                    style={styles.backhaulRow}
                    onPress={() => navigation.push('LoadDetails', { loadId: s.load.id })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.backhaulLane}>
                        {s.load.origin.city}, {s.load.origin.state} → {s.load.destination.city}, {s.load.destination.state}
                      </Text>
                      <Text style={styles.backhaulMeta}>{s.distanceFromDropMiles.toFixed(0)} mi away · ${s.load.rate.toFixed(0)} · {s.load.rpm.toFixed(2)} RPM</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={PHI_COLORS.sunshineYellow} />
                  </Pressable>
                ))
              )}
            </View>
          );
        })()}

        {bookedRecord && bookingState[load.id] === 'cancelled' && (() => {
          const tonu = evaluateTONUEligibility({
            bookingState: bookingState[load.id],
            pickupCheckInISO: bookedRecord.gateTimes?.pickupCheckIn ?? null,
            standardTONURate: prefs.standardTONURate,
          });
          if (!tonu.eligible) return null;
          return (
            <View style={styles.detentionCard}>
              <Text style={styles.detentionTitle}>💰 TONU Claim Available</Text>
              <Text style={styles.detentionSubtitle}>{tonu.reason}</Text>
              <Pressable
                style={styles.gateButton}
                onPress={() => {
                  const lines = [
                    `TRUCK ORDER NOT USED (TONU) CLAIM — ${load.id}`,
                    `Broker: ${load.brokerName}`,
                    `Pickup location: ${load.origin.city}, ${load.origin.state}`,
                    `Checked in at pickup: ${new Date(bookedRecord.gateTimes?.pickupCheckIn as string).toLocaleString()}`,
                    `Load cancelled after driver arrival.`,
                    '',
                    `TONU fee claimed: $${tonu.claimAmount.toFixed(2)}`,
                    '',
                    'Per standard industry practice, this fee is owed when a carrier arrives at pickup as scheduled and the load is cancelled or unavailable. Please remit payment at your earliest convenience.',
                  ];
                  void Share.share({ message: lines.join('\n'), title: `TONU Claim — ${load.id}` });
                }}
              >
                <Text style={styles.gateButtonText}>📤 File TONU Claim (${tonu.claimAmount.toFixed(0)})</Text>
              </Pressable>
            </View>
          );
        })()}

        {(() => {
          const auditEntries = orchestratorLog.filter((e) => e.loadId === load.id).slice().reverse();
          if (auditEntries.length === 0) return null;
          return (
            <View style={styles.detentionCard}>
              <Text style={styles.detentionTitle}>Dispatch Audit Trail</Text>
              <Text style={styles.detentionSubtitle}>Every automated decision made on this load, in order — for broker disputes or a DOT audit.</Text>
              {auditEntries.map((entry) => (
                <View key={entry.id} style={styles.auditRow}>
                  <View style={[styles.auditDot, entry.outcome === 'pass' ? styles.auditDotPass : entry.outcome === 'rejected' ? styles.auditDotRejected : styles.auditDotError]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.auditMessage}>{entry.message}</Text>
                    <Text style={styles.auditMeta}>{entry.stage} · {new Date(entry.timestamp).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
              <Pressable
                style={styles.shareAuditButton}
                onPress={() => {
                  const lines = [
                    `PHI DISPATCH AUDIT TRAIL — ${load.id}`,
                    `${load.origin.city}, ${load.origin.state} → ${load.destination.city}, ${load.destination.state} · Broker: ${load.brokerName}`,
                    '',
                    ...auditEntries.map((e) => `[${new Date(e.timestamp).toLocaleString()}] ${e.stage.toUpperCase()} (${e.outcome}): ${e.message}`),
                  ];
                  void Share.share({ message: lines.join('\n'), title: `PHI Audit Trail — ${load.id}` });
                }}
              >
                <Text style={styles.shareAuditButtonText}>📤 Share Audit Trail</Text>
              </Pressable>
            </View>
          );
        })()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  header: { marginBottom: 20, alignItems: 'center' },
  loadId: { color: PHI_COLORS.white, fontSize: 24, fontWeight: '900', marginBottom: 5 },
  status: { color: PHI_COLORS.moneyGreen, fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  label: { color: '#A8B7D8', fontSize: 14, flex: 1, marginLeft: 4 },
  value: { color: PHI_COLORS.white, fontSize: 14, fontWeight: '700', flex: 2, textAlign: 'right' },
  detentionCard: { backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 14, marginTop: 10 },
  detentionTitle: { color: PHI_COLORS.white, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  detentionSubtitle: { color: '#A8B7D8', fontSize: 12, marginBottom: 12 },
  stopBlock: { marginBottom: 12 },
  stopLabel: { color: PHI_COLORS.sunshineYellow, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  gateButtonRow: { flexDirection: 'row', gap: 8 },
  gateButton: { flex: 1, backgroundColor: PHI_COLORS.surface, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2A3A5C' },
  gateButtonDone: { borderColor: PHI_COLORS.moneyGreen },
  gateButtonDisabled: { opacity: 0.5 },
  gateButtonText: { color: PHI_COLORS.white, fontSize: 12, fontWeight: '700' },
  detentionResult: { color: '#A8B7D8', fontSize: 12, marginTop: 6 },
  totalDetention: { color: PHI_COLORS.moneyGreen, fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  backhaulRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: PHI_COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 8 },
  backhaulLane: { color: PHI_COLORS.white, fontSize: 13, fontWeight: '700' },
  backhaulMeta: { color: '#A8B7D8', fontSize: 12, marginTop: 3 },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: PHI_COLORS.card, borderRadius: 12, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#FF6B6B' },
  cancelButtonText: { color: '#FF6B6B', fontSize: 13, fontWeight: '700' },
  emergencyCard: { borderWidth: 1, borderColor: '#FF6B6B' },
  emergencyTitle: { color: '#FF6B6B', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  auditRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  auditDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  auditDotPass: { backgroundColor: PHI_COLORS.moneyGreen },
  auditDotRejected: { backgroundColor: PHI_COLORS.sunshineYellow },
  auditDotError: { backgroundColor: '#FF6B6B' },
  auditMessage: { color: PHI_COLORS.white, fontSize: 12, lineHeight: 17 },
  auditMeta: { color: '#7F8FB3', fontSize: 11, marginTop: 2 },
  shareAuditButton: { backgroundColor: PHI_COLORS.surface, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 6, borderWidth: 1, borderColor: PHI_COLORS.sunshineYellow },
  shareAuditButtonText: { color: PHI_COLORS.sunshineYellow, fontSize: 13, fontWeight: '700' },
  fscInput: { backgroundColor: PHI_COLORS.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#2A3A5C', marginTop: 4 },
  fscFair: { color: PHI_COLORS.moneyGreen, fontSize: 12, lineHeight: 17, marginTop: 8 },
  fscUnfair: { color: '#FF5252', fontSize: 12, lineHeight: 17, marginTop: 8, fontWeight: '700' },
  accessorialButtonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  accessorialButton: { backgroundColor: PHI_COLORS.surface, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#2A3A5C' },
  accessorialButtonText: { color: PHI_COLORS.sunshineYellow, fontSize: 11, fontWeight: '700' },
});
