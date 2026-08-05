/**
 * LoadBoardsScreen — 5-tab load marketplace
 *
 * Tab 1 — Open Market  : All public loads, filterable
 * Tab 2 — My Loads     : Accepted/booked loads
 * Tab 3 — Hot Loads    : AI-curated high-pay urgent loads
 * Tab 4 — Local        : GPS-radius loads (≤ 150 mi)
 * Tab 5 — Broker Board : Direct shipper postings
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import useLoadsStore from '../store/loadsStore';
import { aggregateLoads } from '../workers/LoadFinderWorker';
import { scoreLoad } from '../workers/LoadScoringWorker';
import { Load } from '../workers/workers-15x';
import SkeletonShimmer from '../components/animations/SkeletonShimmer';
import AnimatedPressable from '../components/game/AnimatedPressable';
import ConnectionStatusBar from '../components/ConnectionStatusBar';
import { useRealtimeLoads } from '../hooks/useRealtimeLoads';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type BoardTab = 'open' | 'mine' | 'hot' | 'local' | 'broker';

const TABS: { id: BoardTab; label: string; icon: string }[] = [
  { id: 'open', label: 'Open Market', icon: '🌎' },
  { id: 'mine', label: 'My Loads', icon: '🚛' },
  { id: 'hot', label: 'Hot Loads', icon: '🔥' },
  { id: 'local', label: 'Local', icon: '📍' },
  { id: 'broker', label: 'Broker Board', icon: '🤝' },
];

// Loads with rate >= this threshold are considered "hot"
const HOT_RPM_THRESHOLD = 3.5;
// Loads within this radius (miles) are "local"
const LOCAL_RADIUS_MILES = 150;

export default function LoadBoardsScreen() {
  const navigation = useNavigation<Nav>();
  const { activeLoads, bookingState, bookingHistory, setLoads, setBookingState, addBookingRecord } =
    useLoadsStore();
  const { status: realtimeStatus } = useRealtimeLoads();
  const [activeTab, setActiveTab] = useState<BoardTab>('open');
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshLoads = useCallback(async () => {
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
    // Auto-refresh every 30 s
    refreshTimerRef.current = setInterval(() => void refreshLoads(), 30_000);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [refreshLoads]);

  const myLoadIds = useMemo(
    () => new Set(bookingHistory.map((r) => r.id)),
    [bookingHistory],
  );

  const filteredLoads = useMemo((): Load[] => {
    switch (activeTab) {
      case 'open':
        return activeLoads;
      case 'mine':
        return activeLoads.filter((l) => myLoadIds.has(l.id));
      case 'hot':
        return activeLoads
          .filter((l) => l.rpm >= HOT_RPM_THRESHOLD)
          .sort((a, b) => b.rpm - a.rpm);
      case 'local':
        // Approximate: filter loads within LOCAL_RADIUS_MILES of a TX origin
        return activeLoads.filter((l) => l.totalMiles <= LOCAL_RADIUS_MILES);
      case 'broker':
        return activeLoads.filter(
          (l) => l.source === 'DAT' || l.source === 'Truckstop' || l.source === 'Loadsmart',
        );
      default:
        return activeLoads;
    }
  }, [activeLoads, activeTab, myLoadIds]);

  const handleBook = async (load: Load) => {
    setBookingState(load.id, 'pending');
    await new Promise((r) => setTimeout(r, 800));
    setBookingState(load.id, 'booked');
    addBookingRecord({
      id: load.id,
      rate: load.rate,
      miles: load.totalMiles,
      rpm: load.rpm,
      bookedAt: new Date().toISOString(),
    });
    Alert.alert('Load Booked ✅', `${load.id} confirmed at $${load.rate.toFixed(0)}.`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ConnectionStatusBar status={realtimeStatus} />
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={(t) => t.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.id && styles.tabActive]}
              onPress={() => setActiveTab(item.id)}
            >
              <Text style={styles.tabIcon}>{item.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === item.id && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Board header */}
      <View style={styles.boardHeader}>
        <Text style={styles.boardTitle}>{TABS.find((t) => t.id === activeTab)?.icon}{' '}{TABS.find((t) => t.id === activeTab)?.label}</Text>
        <Text style={styles.boardCount}>{filteredLoads.length} loads</Text>
      </View>

      {/* Load list */}
      <FlatList
        data={filteredLoads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refreshLoads()}
            tintColor={PHI_COLORS.sunshineYellow}
          />
        }
        ListEmptyComponent={
          refreshing ? (
            <View style={{ gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonShimmer key={i} style={styles.skeletonCard} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#29508C" />
              <Text style={styles.emptyText}>
                {activeTab === 'mine'
                  ? 'No booked loads yet. Head to Open Market to find freight.'
                  : activeTab === 'hot'
                  ? 'No hot loads right now. Check back in a few minutes.'
                  : 'No loads match. Pull to refresh.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <LoadCard
            load={item}
            bookingState={bookingState[item.id] ?? 'unbooked'}
            onDetails={() => navigation.navigate('LoadDetails', { loadId: item.id })}
            onBook={() => void handleBook(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

// ── LoadCard sub-component ────────────────────────────────────────────────────

function LoadCard({
  load,
  bookingState,
  onDetails,
  onBook,
}: {
  load: Load;
  bookingState: string;
  onDetails: () => void;
  onBook: () => void;
}) {
  const score = scoreLoad(load);
  const scoreColor =
    score === 'Diamond' ? '#9BE8FF' : score === 'Gold' ? PHI_COLORS.sunshineYellow : '#B0B8C7';

  // Countdown: loads expire 2h from pickupDate
  const expiresIn = useMemo(() => {
    const pickup = new Date(load.pickupDate).getTime();
    const diff = pickup - Date.now();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  }, [load.pickupDate]);

  return (
    <TouchableOpacity style={styles.card} onPress={onDetails} activeOpacity={0.9}>
      <View style={styles.cardTop}>
        <Text style={styles.loadId}>{load.id}</Text>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <Text style={styles.route}>
        {load.origin.city}, {load.origin.state} → {load.destination.city}, {load.destination.state}
      </Text>

      <View style={styles.metricsRow}>
        <MetricChip label="Rate" value={`$${load.rate.toFixed(0)}`} highlight />
        <MetricChip label="RPM" value={`$${load.rpm.toFixed(2)}`} highlight={load.rpm >= 3.5} />
        <MetricChip label="Miles" value={`${load.totalMiles}`} />
        <MetricChip label="Expires" value={expiresIn} />
      </View>

      <Text style={styles.meta}>
        {load.equipmentType} · {load.brokerName} · ⭐ {load.brokerRating.toFixed(1)} · {load.source}
      </Text>

      <View style={styles.cardActions}>
        <AnimatedPressable
          style={[
            styles.bookBtn,
            bookingState === 'booked' && styles.bookBtnDone,
            bookingState === 'pending' && styles.bookBtnPending,
          ]}
          onPress={onBook}
          disabled={bookingState === 'booked' || bookingState === 'pending'}
        >
          <Text style={styles.bookBtnText}>
            {bookingState === 'booked' ? '✅ Booked' : bookingState === 'pending' ? 'Booking…' : '⚡ Quick Book'}
          </Text>
        </AnimatedPressable>
        <TouchableOpacity style={styles.detailsBtn} onPress={onDetails}>
          <Ionicons name="chevron-forward" size={18} color="#D7E3FF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function MetricChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.metricChip, highlight && styles.metricChipHL]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  tabBar: { backgroundColor: PHI_COLORS.card, borderBottomWidth: 1, borderBottomColor: '#1B3060' },
  tabBarContent: { paddingHorizontal: 10, paddingVertical: 8, gap: 6 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#0A1628',
  },
  tabActive: { backgroundColor: PHI_COLORS.royalBlue },
  tabIcon: { fontSize: 14 },
  tabLabel: { color: '#7F9FCC', fontSize: 12, fontWeight: '700' },
  tabLabelActive: { color: PHI_COLORS.white },
  boardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  boardTitle: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 16 },
  boardCount: { color: '#7F9FCC', fontSize: 13, fontWeight: '700' },
  listContent: { padding: 12, gap: 12, paddingBottom: 24 },
  skeletonCard: { height: 160, borderRadius: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { color: '#7F9FCC', fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  card: {
    backgroundColor: PHI_COLORS.card,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loadId: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 16 },
  scoreBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  scoreText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 11 },
  route: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 14 },
  metricsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metricChip: {
    backgroundColor: '#0A1628',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 52,
  },
  metricChipHL: { backgroundColor: '#0D2A18', borderWidth: 1, borderColor: PHI_COLORS.moneyGreen },
  metricValue: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 13 },
  metricLabel: { color: '#7F9FCC', fontSize: 9, marginTop: 1 },
  meta: { color: '#7F9FCC', fontSize: 11 },
  cardActions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 2 },
  bookBtn: {
    flex: 1,
    backgroundColor: PHI_COLORS.sunshineYellow,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  bookBtnDone: { backgroundColor: PHI_COLORS.moneyGreen },
  bookBtnPending: { backgroundColor: '#29508C' },
  bookBtnText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 13 },
  detailsBtn: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
