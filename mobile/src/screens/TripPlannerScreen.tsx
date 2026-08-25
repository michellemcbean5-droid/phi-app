import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import useLoadsStore from '../store/loadsStore';
import useTripPlannerStore from '../store/tripPlannerStore';
import { getCurrentDriverLocation } from '../api/samsaraConnector';
import { calculateMultiStopRoute } from '../api/googleMapsConnector';
import { sequenceStops, SequencedStop } from '../workers/TripSequencerWorker';

const FALLBACK_START = { latitude: 32.7555, longitude: -97.3308 }; // Fort Worth
const GPS_TIMEOUT_MS = 5000;

// A denied or never-answered location permission prompt must not hang trip planning
// forever — same hard-deadline pattern used by PHIOrchestrator and TruckStopFinderScreen.
const withTimeout = <T,>(promise: Promise<T>, fallback: T, ms = GPS_TIMEOUT_MS): Promise<T> =>
  Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

export default function TripPlannerScreen() {
  const { activeLoads } = useLoadsStore();
  const { selectedLoadIds, toggleLoad, clearSelection } = useTripPlannerStore();
  const [sequencedRoute, setSequencedRoute] = useState<SequencedStop[] | null>(null);
  const [totals, setTotals] = useState<{ totalMiles: number; totalMinutes: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLoads = useMemo(
    () => activeLoads.filter((l) => selectedLoadIds.includes(l.id)),
    [activeLoads, selectedLoadIds],
  );

  const runPlan = async () => {
    if (selectedLoads.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const start = (await withTimeout(getCurrentDriverLocation(), null)) ?? FALLBACK_START;
      const stops = selectedLoads.map((l) => ({
        id: l.id,
        label: `${l.origin.city}, ${l.origin.state} → ${l.destination.city}, ${l.destination.state}`,
        latitude: l.origin.latitude,
        longitude: l.origin.longitude,
      }));
      const ordered = sequenceStops(start, stops);
      setSequencedRoute(ordered);

      const waypoints = [
        { name: 'Current Location', coordinates: start },
        ...ordered.map((s) => ({ name: s.label, coordinates: { latitude: s.latitude, longitude: s.longitude } })),
      ];
      const route = await calculateMultiStopRoute(waypoints);
      setTotals(route);
    } catch {
      setError('Could not calculate the multi-stop route. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Multi-Stop Trip Planner</Text>
          <Text style={styles.headerSubtitle}>
            Select two or more loads to sequence a single continuous move — the Route Optimizer will order the pickups nearest-first and calculate total miles and drive time.
          </Text>
        </View>

        {activeLoads.map((load) => {
          const selected = selectedLoadIds.includes(load.id);
          return (
            <Pressable
              key={load.id}
              style={[styles.loadRow, selected && styles.loadRowSelected]}
              onPress={() => toggleLoad(load.id)}
            >
              <Ionicons
                name={selected ? 'checkbox' : 'square-outline'}
                size={22}
                color={selected ? PHI_COLORS.moneyGreen : '#A8B7D8'}
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.loadLane}>{load.origin.city}, {load.origin.state} → {load.destination.city}, {load.destination.state}</Text>
                <Text style={styles.loadMeta}>{load.id} · ${load.rate.toFixed(0)} · {load.rpm.toFixed(2)} RPM</Text>
              </View>
            </Pressable>
          );
        })}

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.planButton, selectedLoads.length === 0 && styles.planButtonDisabled]}
            disabled={selectedLoads.length === 0 || loading}
            onPress={() => void runPlan()}
          >
            {loading ? <ActivityIndicator color={PHI_COLORS.royalBlue} /> : <Text style={styles.planButtonText}>Sequence Trip ({selectedLoads.length})</Text>}
          </Pressable>
          <Pressable style={styles.clearButton} onPress={() => { clearSelection(); setSequencedRoute(null); setTotals(null); }}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {sequencedRoute && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Sequenced Itinerary</Text>
            {sequencedRoute.map((stop, index) => (
              <View key={stop.id} style={styles.stopRow}>
                <View style={styles.stopBadge}><Text style={styles.stopBadgeText}>{index + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stopLabel}>{stop.label}</Text>
                  <Text style={styles.stopLeg}>{stop.legDistanceMiles.toFixed(0)} mi from previous stop</Text>
                </View>
              </View>
            ))}
            {totals && (
              <Text style={styles.totals}>
                Total: {totals.totalMiles.toFixed(0)} mi · {Math.floor(totals.totalMinutes / 60)}h {totals.totalMinutes % 60}m
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  headerCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 16, padding: 18, marginBottom: 16 },
  headerTitle: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '900', marginBottom: 6 },
  headerSubtitle: { color: '#D8E2FF', fontSize: 13, lineHeight: 18 },
  loadRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: PHI_COLORS.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  loadRowSelected: { borderColor: PHI_COLORS.moneyGreen },
  loadLane: { color: PHI_COLORS.white, fontSize: 13, fontWeight: '700' },
  loadMeta: { color: '#A8B7D8', fontSize: 12, marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 8 },
  planButton: { flex: 1, backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  planButtonDisabled: { opacity: 0.5 },
  planButtonText: { color: PHI_COLORS.royalBlue, fontSize: 14, fontWeight: '800' },
  clearButton: { backgroundColor: PHI_COLORS.card, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' },
  clearButtonText: { color: '#A8B7D8', fontSize: 14, fontWeight: '700' },
  error: { color: '#FF6B6B', fontSize: 13, marginBottom: 10 },
  resultCard: { backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 16, marginTop: 8 },
  resultTitle: { color: PHI_COLORS.white, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stopBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: PHI_COLORS.sunshineYellow, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stopBadgeText: { color: PHI_COLORS.royalBlue, fontWeight: '900', fontSize: 13 },
  stopLabel: { color: PHI_COLORS.white, fontSize: 13, fontWeight: '700' },
  stopLeg: { color: '#A8B7D8', fontSize: 12, marginTop: 2 },
  totals: { color: PHI_COLORS.moneyGreen, fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 8 },
});
