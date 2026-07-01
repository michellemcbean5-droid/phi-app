import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import useWorkerStore from '../store/workerStore';
import usePromoStore from '../store/promoStore';
import useAgentStore from '../store/agentStore';
import useAuthStore from '../store/authStore';
import { validateJWT } from '../middleware/authMiddleware';
import RibbonBanner from '../components/game/RibbonBanner';
import GlossyCard from '../components/game/GlossyCard';
import EfficiencyDial from '../components/game/EfficiencyDial';
import ProfitBarChart from '../components/game/ProfitBarChart';
import CoinBurst from '../components/game/CoinBurst';

const PROFIT_TREND_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'];

type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const GREETING = (() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
})();

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { workers, dailyRevenue } = useWorkerStore();
  const { activeTier, isTrialActive, daysRemaining } = usePromoStore();
  const { token } = useAuthStore();
  const { activityFeed, coinBurstSeq, connect, disconnect } = useAgentStore();
  const [findingFreight, setFindingFreight] = useState(false);
  const [tripActive, setTripActive] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const activeWorkers = workers.filter((w) => w.status === 'active').length;
  const totalRevenue = dailyRevenue;
  const cpm = 0.68;
  const netProfit = totalRevenue - totalRevenue * cpm;
  const trialActive = isTrialActive();
  const days = daysRemaining();
  const efficiency = Math.round((activeWorkers / 10) * 100);
  const profitTrend = [0.55, 0.68, 0.6, 0.78, 0.9, 1].map((factor) => Math.max(1, Math.round(netProfit * factor)));

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim, slideAnim]);

  useEffect(() => {
    if (!token) return;
    const payload = validateJWT(token);
    if (!payload) return;
    connect(payload.userId);
    return () => disconnect();
  }, [token, connect, disconnect]);

  const handleFindFreight = (): void => {
    setFindingFreight(true);
    setTimeout(() => {
      setFindingFreight(false);
      navigation.navigate('Loads');
    }, 1800);
  };

  const handleStartTrip = (): void => {
    setTripActive(true);
    navigation.navigate('AICommandCenter');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: slideAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <View>
            <Text style={styles.greeting}>{GREETING}, Driver</Text>
            <Text style={styles.subGreeting}>PHI is running your business right now</Text>
          </View>
          <TouchableOpacity style={styles.tierPill} onPress={() => navigation.navigate('Subscription')}>
            <Text style={styles.tierPillText}>{activeTier}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Trial Banner */}
        {trialActive && (
          <View style={styles.trialBanner}>
            <Ionicons name="gift-outline" size={16} color={PHI_COLORS.charcoalBlack} />
            <Text style={styles.trialBannerText}>Free trial active — {days} days remaining</Text>
          </View>
        )}

        {/* Revenue Command Panel */}
        <View style={styles.commandPanel}>
          <Text style={styles.commandLabel}>TODAY'S REVENUE</Text>
          <Text style={styles.revenueValue}>${totalRevenue.toLocaleString()}</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>${cpm.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Cost Per Mile</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: PHI_COLORS.moneyGreen }]}>${Math.round(netProfit).toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Net Profit</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{activeWorkers}/10</Text>
              <Text style={styles.metricLabel}>AI Workers</Text>
            </View>
          </View>
        </View>

        {/* Command Dashboard */}
        <RibbonBanner title="Teamwork" style={styles.teamworkRibbon} />
        <GlossyCard style={styles.teamworkCard}>
          <EfficiencyDial value={efficiency} size={140} />
          <View style={styles.teamworkDivider} />
          <View style={styles.profitChartWrap}>
            <ProfitBarChart values={profitTrend} labels={PROFIT_TREND_LABELS} height={120} />
          </View>
        </GlossyCard>

        {/* Primary Action: Find Freight */}
        <Animated.View style={{ transform: [{ scale: findingFreight ? pulseAnim : 1 }] }}>
          <TouchableOpacity
            style={[styles.findFreightButton, findingFreight && styles.findFreightButtonActive]}
            onPress={handleFindFreight}
            disabled={findingFreight}
          >
            <Ionicons name={findingFreight ? 'radio-outline' : 'search-outline'} size={26} color={PHI_COLORS.charcoalBlack} />
            <View>
              <Text style={styles.findFreightTitle}>
                {findingFreight ? 'Freight Negotiator Working...' : 'Find Freight'}
              </Text>
              <Text style={styles.findFreightSub}>
                {findingFreight ? 'Scanning DAT · Bidding on top lanes' : 'AI scans load boards & negotiates your rate'}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Start Trip */}
        <TouchableOpacity
          style={[styles.startTripButton, tripActive && styles.startTripActive]}
          onPress={handleStartTrip}
        >
          <Ionicons name={tripActive ? 'navigate' : 'navigate-outline'} size={22} color={PHI_COLORS.white} />
          <View>
            <Text style={styles.startTripTitle}>{tripActive ? 'Trip Active — Tap for Status' : 'Start Trip Mode'}</Text>
            <Text style={styles.startTripSub}>Route Optimizer · Fuel Optimizer · Dispatcher take over</Text>
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Documents')}>
            <Ionicons name="folder-outline" size={26} color={PHI_COLORS.sunshineYellow} />
            <Text style={styles.quickLabel}>Virtual Glovebox</Text>
            <Text style={styles.quickSub}>BOL · POD · Permits</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Compliance')}>
            <Ionicons name="shield-checkmark-outline" size={26} color={PHI_COLORS.moneyGreen} />
            <Text style={styles.quickLabel}>Compliance</Text>
            <Text style={styles.quickSub}>ELD · HOS · IFTA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('AICommandCenter')}>
            <Ionicons name="hardware-chip-outline" size={26} color="#7EA5FF" />
            <Text style={styles.quickLabel}>AI Workers</Text>
            <Text style={styles.quickSub}>{activeWorkers} active now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Earnings')}>
            <Ionicons name="trending-up-outline" size={26} color={PHI_COLORS.sunshineYellow} />
            <Text style={styles.quickLabel}>Earnings</Text>
            <Text style={styles.quickSub}>P&L · CPM · Trends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('DispatcherRadio')}>
            <Ionicons name="radio-outline" size={26} color="#FF5252" />
            <Text style={styles.quickLabel}>Dispatcher Radio</Text>
            <Text style={styles.quickSub}>Push to talk</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Inbox')}>
            <Ionicons name="chatbubbles-outline" size={26} color="#9BE8FF" />
            <Text style={styles.quickLabel}>Messages</Text>
            <Text style={styles.quickSub}>Dispatch & brokers</Text>
          </TouchableOpacity>
        </View>

        {/* Worker Status Strip */}
        <View style={styles.workerStrip}>
          <Text style={styles.workerStripTitle}>AI Fleet Status</Text>
          {workers.slice(0, 6).map((w) => (
            <View key={w.id} style={styles.workerRow}>
              <View style={[styles.workerDot, { backgroundColor: w.status === 'active' ? PHI_COLORS.moneyGreen : '#5C6780' }]} />
              <Text style={styles.workerRowName}>{w.role}</Text>
              <Text style={styles.workerRowTasks}>{w.tasksToday} tasks</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => navigation.navigate('AICommandCenter')}>
            <Text style={styles.viewAllLink}>View all 10 workers →</Text>
          </TouchableOpacity>
        </View>

        {/* Live AI Activity Feed (backend WebSocket) */}
        {activityFeed.length > 0 && (
          <View style={styles.workerStrip}>
            <Text style={styles.workerStripTitle}>Live AI Activity</Text>
            {activityFeed.slice(0, 5).map((entry) => (
              <View key={entry.id} style={styles.activityRow}>
                <Text style={styles.activityAgent}>{entry.agentName}</Text>
                <Text style={styles.activitySummary} numberOfLines={1}>{entry.summary}</Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
      <CoinBurst trigger={coinBurstSeq} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.royalBlue },
  content: { padding: 16, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: PHI_COLORS.white, fontSize: 22, fontWeight: '900' },
  subGreeting: { color: '#A8C0FF', fontSize: 13, marginTop: 2 },
  tierPill: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  tierPillText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 12 },
  trialBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, padding: 10 },
  trialBannerText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 13 },
  commandPanel: { backgroundColor: '#0A1F3D', borderRadius: 22, padding: 22, gap: 4, borderWidth: 1, borderColor: '#1E3A62' },
  commandLabel: { color: '#7F9FCC', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  revenueValue: { color: PHI_COLORS.white, fontSize: 44, fontWeight: '900', marginTop: 4 },
  metricsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 0 },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800' },
  metricLabel: { color: '#7F9FCC', fontSize: 11, marginTop: 3 },
  metricDivider: { width: 1, height: 36, backgroundColor: '#1E3A62' },
  teamworkRibbon: { marginTop: 4 },
  teamworkCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  teamworkDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#1E3A62' },
  profitChartWrap: { flex: 1 },
  findFreightButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  findFreightButtonActive: { backgroundColor: '#FFE878' },
  findFreightTitle: { color: PHI_COLORS.charcoalBlack, fontSize: 20, fontWeight: '900' },
  findFreightSub: { color: '#3A3A00', fontSize: 12, marginTop: 3 },
  startTripButton: { backgroundColor: PHI_COLORS.moneyGreen, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  startTripActive: { backgroundColor: '#00A044' },
  startTripTitle: { color: PHI_COLORS.white, fontSize: 17, fontWeight: '900' },
  startTripSub: { color: '#C0FFD8', fontSize: 12, marginTop: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { width: '47%', backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 6 },
  quickLabel: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 14 },
  quickSub: { color: '#7F9FCC', fontSize: 12 },
  workerStrip: { backgroundColor: PHI_COLORS.card, borderRadius: 18, padding: 18, gap: 10 },
  workerStripTitle: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 16, marginBottom: 4 },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  workerDot: { width: 8, height: 8, borderRadius: 4 },
  workerRowName: { color: '#D7E3FF', fontSize: 13, flex: 1 },
  workerRowTasks: { color: '#7F9FCC', fontSize: 12 },
  viewAllLink: { color: PHI_COLORS.sunshineYellow, fontWeight: '700', fontSize: 13, marginTop: 4 },
  activityRow: { gap: 1 },
  activityAgent: { color: PHI_COLORS.sunshineYellow, fontWeight: '700', fontSize: 12 },
  activitySummary: { color: '#D7E3FF', fontSize: 12 },
});
