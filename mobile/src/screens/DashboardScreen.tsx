import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import useWorkerStore from '../store/workerStore';
import usePromoStore from '../store/promoStore';
import useLoadsStore from '../store/loadsStore';
import { fetchLiveDieselPrice } from '../utils/fuelOptimizer';
import { aggregateLoads } from '../workers/LoadFinderWorker';
import { getTipOfTheDay, getRandomTip } from '../utils/driverTips';
import RibbonBanner from '../components/game/RibbonBanner';
import GlossyCard from '../components/game/GlossyCard';
import EfficiencyDial from '../components/game/EfficiencyDial';
import ProfitBarChart from '../components/game/ProfitBarChart';
import CoinBurst from '../components/game/CoinBurst';
import AnimatedPressable from '../components/game/AnimatedPressable';
import PrinceHaulMascot from '../components/mascot/PrinceHaulMascot';
import BouncyButton from '../components/animations/BouncyButton';
import AnimatedNumber from '../components/animations/AnimatedNumber';
import StaggeredEntrance from '../components/animations/StaggeredEntrance';
import StaggeredList from '../components/animations/StaggeredList';
import ConfettiCelebration from '../components/animations/ConfettiCelebration';
import FloatingShapes from '../components/animations/FloatingShapes';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS, CARTOON_TYPOGRAPHY } from '../theme/cartoonTheme';

const PROFIT_TREND_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'];
const AVG_TRUCK_MPG = 6.5;
const FALLBACK_CPM = 0.68;

const MASCOT_TIPS = [
  'Tap me for a surprise! 🎉',
  'Check your fuel optimizer daily!',
  'Your AI workers are crushing it!',
  'New loads available nearby!',
  'Keep that streak going! 🔥',
];

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
  const { workers, dailyRevenue, activityLog, coinBurstSeq } = useWorkerStore();
  const { isTrialActive, daysRemaining, getEffectiveTier } = usePromoStore();
  const { setLoads } = useLoadsStore();
  const [findingFreight, setFindingFreight] = useState(false);
  const [tripActive, setTripActive] = useState(false);
  const [cpm, setCpm] = useState(FALLBACK_CPM);
  const [tip, setTip] = useState(getTipOfTheDay());
  const [mascotTip, setMascotTip] = useState(MASCOT_TIPS[0]);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [mascotMood, setMascotMood] = useState<'happy' | 'excited' | 'celebrating'>('happy');
  const activeTier = getEffectiveTier();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const activeWorkers = workers.filter((w) => w.status === 'active').length;
  const totalRevenue = dailyRevenue;
  const netProfit = totalRevenue - totalRevenue * cpm;
  const trialActive = isTrialActive();
  const days = daysRemaining();
  const efficiency = Math.round((activeWorkers / 10) * 100);
  const profitTrend = [0.55, 0.68, 0.6, 0.78, 0.9, 1].map((factor) => Math.max(1, Math.round(netProfit * factor)));

  useEffect(() => {
    fetchLiveDieselPrice()
      .then((price) => setCpm(Number((price.nationalAverage / AVG_TRUCK_MPG).toFixed(2))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim, slideAnim]);

  const handleMascotPress = useCallback(() => {
    const randomTip = MASCOT_TIPS[Math.floor(Math.random() * MASCOT_TIPS.length)];
    setMascotTip(randomTip);
    setMascotMood('excited');
    setTimeout(() => setMascotMood('happy'), 2000);
  }, []);

  const handleFindFreight = (): void => {
    setFindingFreight(true);
    aggregateLoads()
      .then((loads) => {
        setLoads(loads);
        setMascotMood('celebrating');
        setConfettiTrigger((prev) => prev + 1);
        setTimeout(() => setMascotMood('happy'), 3000);
      })
      .catch(() => {})
      .finally(() => {
        setFindingFreight(false);
        navigation.navigate('Loads');
      });
  };

  const handleStartTrip = (): void => {
    setTripActive(true);
    setMascotMood('excited');
    navigation.navigate('AICommandCenter');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FloatingShapes shapeCount={8} />
      <ConfettiCelebration trigger={confettiTrigger} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header with Mascot */}
        <Animated.View style={[styles.header, { opacity: slideAnim, transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{GREETING}, Driver! 👋</Text>
            <Text style={styles.subGreeting}>Prince Haul is running your business right now</Text>
          </View>
          <PrinceHaulMascot
            mood={mascotMood}
            size={70}
            onPress={handleMascotPress}
            showSpeechBubble={true}
            speechText={mascotTip}
          />
        </Animated.View>

        {/* Tier Pill */}
        <TouchableOpacity style={styles.tierPill} onPress={() => navigation.navigate('Subscription')}>
          <LinearGradient
            colors={CARTOON_COLORS.gradientCandy}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tierPillGradient}
          >
            <Text style={styles.tierPillText}>⭐ {activeTier}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Trial Banner */}
        {trialActive && (
          <View style={styles.trialBanner}>
            <Ionicons name="gift-outline" size={20} color={CARTOON_COLORS.charcoal} />
            <Text style={styles.trialBannerText}>🎁 Free trial active — {days} days remaining!</Text>
          </View>
        )}

        {/* Revenue Command Panel */}
        <StaggeredEntrance index={1}>
        <LinearGradient
          colors={CARTOON_COLORS.gradientOcean}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.commandPanel}
        >
          <Text style={styles.commandLabel}>💰 TODAY'S REVENUE</Text>
          <AnimatedNumber value={totalRevenue} prefix="$" style={styles.revenueValue} />
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <AnimatedNumber value={cpm} prefix="$" decimals={2} style={styles.metricValue} />
              <Text style={styles.metricLabel}>Cost Per Mile</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <AnimatedNumber value={Math.round(netProfit)} prefix="$" style={[styles.metricValue, { color: CARTOON_COLORS.sunshineYellow }]} />
              <Text style={styles.metricLabel}>Net Profit</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{activeWorkers}/10 🤖</Text>
              <Text style={styles.metricLabel}>AI Workers</Text>
            </View>
          </View>
        </LinearGradient>
        </StaggeredEntrance>

        {/* Driver Tip of the Day */}
        <StaggeredEntrance index={2}>
        <TouchableOpacity style={styles.tipCard} onPress={() => setTip(getRandomTip(tip))}>
          <Ionicons name="bulb-outline" size={24} color={CARTOON_COLORS.sunshineYellow} />
          <Text style={styles.tipText}>{tip}</Text>
          <Ionicons name="refresh-outline" size={18} color={CARTOON_COLORS.electricBlue} />
        </TouchableOpacity>
        </StaggeredEntrance>

        {/* Command Dashboard */}
        <StaggeredEntrance index={3}>
          <RibbonBanner title="Teamwork" style={styles.teamworkRibbon} />
        </StaggeredEntrance>
        <StaggeredEntrance index={4}>
        <GlossyCard style={styles.teamworkCard}>
          <EfficiencyDial value={efficiency} size={140} />
          <View style={styles.teamworkDivider} />
          <View style={styles.profitChartWrap}>
            <ProfitBarChart values={profitTrend} labels={PROFIT_TREND_LABELS} height={120} />
          </View>
        </GlossyCard>
        </StaggeredEntrance>

        {/* Primary Action: Find Freight */}
        <StaggeredEntrance index={5}>
        <Animated.View style={{ transform: [{ scale: findingFreight ? pulseAnim : 1 }] }}>
          <BouncyButton
            label={findingFreight ? '🚛 Finding Freight...' : '🔍 Find Freight'}
            onPress={handleFindFreight}
            variant="warning"
            size="lg"
            icon={<Ionicons
              name={findingFreight ? 'radio-outline' : 'search-outline'}
              size={24}
              color={CARTOON_COLORS.charcoal}
            />}
          />
        </Animated.View>
        </StaggeredEntrance>

        {/* Start Trip */}
        <StaggeredEntrance index={6}>
        <BouncyButton
          label={tripActive ? '🚀 Trip Active — Tap for Status' : '🛣️ Start Trip Mode'}
          onPress={handleStartTrip}
          variant="success"
          size="lg"
          icon={<Ionicons
            name={tripActive ? 'navigate' : 'navigate-outline'}
            size={24}
            color="#FFFFFF"
          />}
        />
        </StaggeredEntrance>

        {/* Quick Actions Grid */}
        <StaggeredList staggerDelay={60} direction="up">
          <View style={styles.quickGrid}>
            {[
              { icon: 'map-outline', color: CARTOON_COLORS.royalBlue, label: 'Business Blueprint', sub: 'LLC · EIN · Authority', screen: 'BusinessBlueprint' },
              { icon: 'people-outline', color: CARTOON_COLORS.bubblegumPink, label: 'Driver’s Circle', sub: 'Peers · Mentors · Safety', screen: 'DriverCircle' },
              { icon: 'folder-outline', color: CARTOON_COLORS.sunshineYellow, label: 'Virtual Glovebox', sub: 'BOL · POD · Permits', screen: 'Documents' },
              { icon: 'shield-checkmark-outline', color: CARTOON_COLORS.limeGreen, label: 'Compliance', sub: 'ELD · HOS · IFTA', screen: 'Compliance' },
              { icon: 'hardware-chip-outline', color: CARTOON_COLORS.electricBlue, label: 'AI Workers', sub: `${activeWorkers} active now`, screen: 'AICommandCenter' },
              { icon: 'navigate-outline', color: CARTOON_COLORS.moneyGreen, label: 'Dispatch Hub', sub: 'RPM · Deadhead · Checks', screen: 'IndependentDispatchHub' },
              { icon: 'wallet-outline', color: CARTOON_COLORS.tangerine, label: 'Cash Flow', sub: 'Invoices · Reserves · Fees', screen: 'CashFlow' },
              { icon: 'trending-up-outline', color: CARTOON_COLORS.sunshineYellow, label: 'Earnings', sub: 'P&L · CPM · Trends', screen: 'Earnings' },
              { icon: 'radio-outline', color: CARTOON_COLORS.bubblegumPink, label: 'Dispatcher Radio', sub: 'Push to talk', screen: 'DispatcherRadio' },
              { icon: 'chatbubbles-outline', color: CARTOON_COLORS.neonCyan, label: 'Messages', sub: 'Dispatch & brokers', screen: 'Inbox' },
              { icon: 'chatbubble-ellipses-outline', color: CARTOON_COLORS.bubblegumPink, label: 'Ask Michelle', sub: 'Support & how-to', screen: 'SupportChat' },
              { icon: 'speedometer-outline', color: CARTOON_COLORS.limeGreen, label: 'Truck Stops', sub: 'Fuel · Parking · Weigh', screen: 'TruckStopFinder' },
            ].map((item, index) => (
              <AnimatedPressable
                key={item.screen}
                style={[
                  styles.quickCard,
                  { backgroundColor: getPastelTint(item.color, 0.15), borderColor: item.color },
                ]}
                onPress={() => navigation.navigate(item.screen as any)}
              >
                <Ionicons name={item.icon as any} size={28} color={item.color} />
                <Text style={[styles.quickLabel, { color: item.color }]}>{item.label}</Text>
                <Text style={styles.quickSub}>{item.sub}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </StaggeredList>

        {/* Worker Status Strip */}
        <StaggeredEntrance index={7}>
        <View style={styles.workerStrip}>
          <View style={styles.workerStripHeader}>
            <PrinceHaulMascot mood="thinking" size={40} showSpeechBubble={false} />
            <Text style={styles.workerStripTitle}>AI Fleet Status</Text>
          </View>
          {workers.slice(0, 6).map((w) => (
            <View key={w.id} style={styles.workerRow}>
              <View style={[styles.workerDot, { backgroundColor: w.status === 'active' ? CARTOON_COLORS.limeGreen : '#5C6780' }]} />
              <Text style={styles.workerRowName}>{w.role}</Text>
              <Text style={styles.workerRowTasks}>{w.tasksToday} tasks</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => navigation.navigate('AICommandCenter')}>
            <Text style={styles.viewAllLink}>View all 10 workers →</Text>
          </TouchableOpacity>
        </View>
        </StaggeredEntrance>

        {/* Live AI Activity Feed */}
        {activityLog.length > 0 && (
          <StaggeredEntrance index={8}>
          <View style={styles.workerStrip}>
            <Text style={styles.workerStripTitle}>🔥 Live AI Activity</Text>
            {activityLog.slice(0, 5).map((entry) => (
              <View key={entry.id} style={styles.activityRow}>
                <Text style={styles.activityAgent}>{entry.workerRole}</Text>
                <Text style={styles.activitySummary} numberOfLines={1}>{entry.summary}</Text>
              </View>
            ))}
          </View>
          </StaggeredEntrance>
        )}

      </ScrollView>
      <CoinBurst trigger={coinBurstSeq} />
    </SafeAreaView>
  );
}

function getPastelTint(color: string, opacity: number = 0.15): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { padding: 16, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerLeft: { flex: 1, marginRight: 12 },
  greeting: { color: CARTOON_COLORS.charcoal, fontSize: 24, fontWeight: '900' },
  subGreeting: { color: CARTOON_COLORS.slate, fontSize: 14, marginTop: 4, fontWeight: '600' },
  tierPill: { alignSelf: 'flex-start', marginBottom: 8, borderRadius: CARTOON_RADIUS.pill, overflow: 'hidden' },
  tierPillGradient: { paddingHorizontal: 16, paddingVertical: 8 },
  tierPillText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  trialBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CARTOON_COLORS.sunshineYellow, borderRadius: CARTOON_RADIUS.lg, padding: 14, ...CARTOON_SHADOWS.md },
  trialBannerText: { color: CARTOON_COLORS.charcoal, fontWeight: '800', fontSize: 14 },
  tipCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: CARTOON_RADIUS.lg, padding: 16, borderWidth: 2, borderColor: CARTOON_COLORS.sunshineYellow, ...CARTOON_SHADOWS.sm },
  tipText: { flex: 1, color: CARTOON_COLORS.charcoal, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  commandPanel: { borderRadius: CARTOON_RADIUS.xl, padding: 24, gap: 6, ...CARTOON_SHADOWS.lg },
  commandLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  revenueValue: { color: '#FFFFFF', fontSize: 44, fontWeight: '900', marginTop: 4 },
  metricsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 0 },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  metricLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4, fontWeight: '600' },
  metricDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  teamworkRibbon: { marginTop: 4 },
  teamworkCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#FFFFFF', borderRadius: CARTOON_RADIUS.xl, padding: 16, ...CARTOON_SHADOWS.md },
  teamworkDivider: { width: 1, alignSelf: 'stretch', backgroundColor: '#E0E7FF' },
  profitChartWrap: { flex: 1 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { width: '47%', borderRadius: CARTOON_RADIUS.lg, padding: 16, gap: 6, borderWidth: 2, ...CARTOON_SHADOWS.sm },
  quickLabel: { fontWeight: '800', fontSize: 14 },
  quickSub: { color: CARTOON_COLORS.slate, fontSize: 12, fontWeight: '500' },
  workerStrip: { backgroundColor: '#FFFFFF', borderRadius: CARTOON_RADIUS.xl, padding: 18, gap: 10, ...CARTOON_SHADOWS.md },
  workerStripHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  workerStripTitle: { color: CARTOON_COLORS.charcoal, fontWeight: '900', fontSize: 16 },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  workerDot: { width: 10, height: 10, borderRadius: 5 },
  workerRowName: { color: CARTOON_COLORS.slate, fontSize: 13, flex: 1, fontWeight: '600' },
  workerRowTasks: { color: '#8B9DC3', fontSize: 12, fontWeight: '500' },
  viewAllLink: { color: CARTOON_COLORS.electricBlue, fontWeight: '700', fontSize: 13, marginTop: 4 },
  activityRow: { gap: 2 },
  activityAgent: { color: CARTOON_COLORS.electricBlue, fontWeight: '700', fontSize: 12 },
  activitySummary: { color: CARTOON_COLORS.slate, fontSize: 12, fontWeight: '500' },
});
