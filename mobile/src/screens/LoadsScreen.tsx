import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import useLoadsStore, { SortOption } from '../store/loadsStore';
import { getCurrentDriverLocation } from '../api/samsaraConnector';
import { sendNearbyLoadAlert } from '../api/twilioConnector';
import { calculateGPSDeadhead, Coordinates } from '../api/googleMapsConnector';
import { executeBooking } from '../workers/AutoBookingEngine';
import { aggregateLoads } from '../workers/LoadFinderWorker';
import { scoreLoad, LoadScore } from '../workers/LoadScoringWorker';
import { calculateDeadhead } from '../workers/RouteAnalysisWorker';
import { Load } from '../workers/workers-15x';
import useWorkerStore from '../store/workerStore';

type LoadsNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Loads'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const FALLBACK_LOCATION: Coordinates = { latitude: 32.7555, longitude: -97.3308 };
const NEARBY_ALERT_RADIUS_MILES = 25;
const PROXIMITY_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const SCORE_FILTERS = ['All', 'Diamond', 'Gold', 'Standard'] as const;
const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'RPM', value: 'rpm' },
  { label: 'Rate', value: 'rate' },
  { label: 'Miles', value: 'miles' },
];

export default function LoadsScreen() {
  const navigation = useNavigation<LoadsNavigationProp>();
  const { activeLoads, bookingState, filter, sortBy, setLoads, setBookingState, addBookingRecord, setFilter, setSortBy } = useLoadsStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const alertedLoadIds = useRef<Set<string>>(new Set());

  const loadBoard = useMemo(() => {
    const scored = activeLoads.filter((load) => {
      if (filter === 'All') return true;
      try { return scoreLoad(load) === (filter as LoadScore); } catch { return false; }
    });
    return [...scored].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [activeLoads, filter, sortBy]);

  const refreshLoads = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      const loads = await aggregateLoads();
      setLoads(loads);
    } finally {
      setRefreshing(false);
    }
  }, [setLoads]);

  useEffect(() => {
    void refreshLoads();
  }, [refreshLoads]);

  const checkNearbyLoads = useCallback(async (): Promise<void> => {
    const location = await getCurrentDriverLocation();
    if (!location || activeLoads.length === 0) return;

    for (const load of activeLoads) {
      if (alertedLoadIds.current.has(load.id)) continue;
      try {
        const distance = await calculateGPSDeadhead(location, load.origin);
        if (distance <= NEARBY_ALERT_RADIUS_MILES) {
          alertedLoadIds.current.add(load.id);
          void sendNearbyLoadAlert(load.id, load.origin.city, distance, load.rate);
          useWorkerStore.getState().recordTaskCompletion(
            'track-trace',
            0,
            `Alerted you to ${load.id} — ${distance.toFixed(1)} mi away`,
          );
        }
      } catch {
        // Skip this load's proximity check on error
      }
    }
  }, [activeLoads]);

  useEffect(() => {
    void checkNearbyLoads();
    const interval = setInterval(() => void checkNearbyLoads(), PROXIMITY_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkNearbyLoads]);

  const handleAnalyzeRoute = async (load: Load): Promise<void> => {
    const location = (await getCurrentDriverLocation()) ?? FALLBACK_LOCATION;
    const analysis = await calculateDeadhead(location, load.origin, load.totalMiles);
    Alert.alert(
      'Route Analysis',
      `${load.id}: ${analysis.deadheadMiles.toFixed(1)} deadhead miles (${analysis.deadheadPercentage}%). ${analysis.rejected ? analysis.rejectionReason : 'Route approved.'}`,
    );
  };

  const handleBookLoad = async (load: Load): Promise<void> => {
    setBookingState(load.id, 'pending');
    const confirmation = await executeBooking(load, 82);
    setBookingState(load.id, confirmation.booked ? 'booked' : 'rejected');
    Alert.alert('Booking Update', confirmation.message);
    if (confirmation.booked) {
      const { recordTaskCompletion } = useWorkerStore.getState();
      recordTaskCompletion('freight-negotiator', load.rate, `Booked ${load.id} at $${load.rate.toFixed(0)}`);
      recordTaskCompletion('dispatch-coordinator', 0, `Confirmed pickup for ${load.id}`);
      addBookingRecord({ id: load.id, rate: load.rate, miles: load.totalMiles, rpm: load.rpm, bookedAt: new Date().toISOString() });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={loadBoard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refreshLoads()} tintColor={PHI_COLORS.sunshineYellow} />}
        ListHeaderComponent={
          <>
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>PHI Load Board</Text>
              <Text style={styles.headerSubtitle}>Pull to refresh live dry van opportunities from DAT and Truckstop.</Text>
            </View>
            <View style={styles.controlRow}>
              {SCORE_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, filter === f && styles.chipActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.controlRow}>
              <Text style={styles.sortLabel}>Sort:</Text>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, sortBy === opt.value && styles.chipActive]}
                  onPress={() => setSortBy(opt.value)}
                >
                  <Text style={[styles.chipText, sortBy === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => {
          const loadScore = scoreLoad(item);
          return (
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LoadDetails', { loadId: item.id })}>
              <View style={styles.cardHeader}>
                <Text style={styles.loadId}>{item.id}</Text>
                <View style={[styles.scoreBadge, loadScore === 'Diamond' ? styles.diamondBadge : loadScore === 'Gold' ? styles.goldBadge : styles.standardBadge]}>
                  <Text style={styles.scoreText}>{loadScore}</Text>
                </View>
              </View>
              <Text style={styles.routeText}>{item.origin.city}, {item.origin.state} → {item.destination.city}, {item.destination.state}</Text>
              <Text style={styles.metaText}>Rate: ${item.rate.toFixed(0)} • RPM: {item.rpm.toFixed(2)} • Broker: {item.brokerRating.toFixed(1)}★</Text>
              <Text style={styles.metaText}>Equipment: {item.equipmentType} • Miles: {item.totalMiles}</Text>
              <Text style={styles.bookingState}>Booking: {bookingState[item.id] ?? 'unbooked'}</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => void handleBookLoad(item)}>
                  <Text style={styles.primaryButtonText}>Book Load</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => void handleAnalyzeRoute(item)}>
                  <Text style={styles.secondaryButtonText}>Analyze Route</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 14 },
  headerCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 18, padding: 18, marginBottom: 10 },
  controlRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: PHI_COLORS.card, borderWidth: 1, borderColor: '#29508C' },
  chipActive: { backgroundColor: PHI_COLORS.sunshineYellow, borderColor: PHI_COLORS.sunshineYellow },
  chipText: { color: '#D7E3FF', fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: PHI_COLORS.charcoalBlack },
  sortLabel: { color: '#D7E3FF', fontWeight: '700', fontSize: 13 },
  headerTitle: { color: PHI_COLORS.white, fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#E7EEFF', marginTop: 8, lineHeight: 20 },
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loadId: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 18 },
  scoreBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  diamondBadge: { backgroundColor: '#9BE8FF' },
  goldBadge: { backgroundColor: PHI_COLORS.sunshineYellow },
  standardBadge: { backgroundColor: '#B0B8C7' },
  scoreText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800' },
  routeText: { color: PHI_COLORS.white, fontSize: 16, fontWeight: '700' },
  metaText: { color: '#D7E3FF' },
  bookingState: { color: PHI_COLORS.moneyGreen, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryButton: { flex: 1, backgroundColor: PHI_COLORS.sunshineYellow, padding: 12, borderRadius: 12 },
  secondaryButton: { flex: 1, backgroundColor: PHI_COLORS.royalBlue, padding: 12, borderRadius: 12 },
  primaryButtonText: { color: PHI_COLORS.charcoalBlack, textAlign: 'center', fontWeight: '800' },
  secondaryButtonText: { color: PHI_COLORS.white, textAlign: 'center', fontWeight: '800' },
});
