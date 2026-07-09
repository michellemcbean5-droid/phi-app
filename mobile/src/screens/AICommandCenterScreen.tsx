import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PrinceHaulMascot from '../components/mascot/PrinceHaulMascot';
import FloatingShapes from '../components/animations/FloatingShapes';
import BouncyButton from '../components/animations/BouncyButton';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS } from '../theme/cartoonTheme';
import { isClaudeConfigured } from '../api/claudeClient';
import useWorkerStore from '../store/workerStore';
import { RootStackParamList } from '../navigation/RootNavigator';

type AICommandCenterNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatHeartbeat = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return new Date(timestamp).toLocaleTimeString();
};

const STATUS_COLORS = {
  active: CARTOON_COLORS.limeGreen,
  idle: '#7F8FB3',
  error: '#FF5252',
} as const;

const MASCOT_TIPS = [
  'Your AI fleet is ready to work!',
  'Start all workers to maximize revenue!',
  'Each worker handles a different task!',
  'Pause workers anytime you need a break!',
];

export default function AICommandCenterScreen() {
  const navigation = useNavigation<AICommandCenterNavigationProp>();
  const { workers, dailyRevenue, startAllWorkers, stopAllWorkers, startWorker, stopWorker, updateHeartbeat } =
    useWorkerStore();
  const activeWorkers = workers.filter((w) => w.status === 'active').length;
  const aiPowered = isClaudeConfigured();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [explainerVisible, setExplainerVisible] = useState(false);
  const [mascotMood, setMascotMood] = useState<'happy' | 'excited' | 'celebrating'>('happy');
  const [mascotTip, setMascotTip] = useState(MASCOT_TIPS[0]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    const interval = setInterval(() => {
      workers.filter((w) => w.status === 'active').forEach((w) => updateHeartbeat(w.id));
    }, 30_000);
    return () => clearInterval(interval);
  }, [workers, updateHeartbeat]);

  const totalRevenue = workers.reduce((sum, w) => sum + w.revenueImpact, 0);

  const handleMascotPress = useCallback(() => {
    const randomTip = MASCOT_TIPS[Math.floor(Math.random() * MASCOT_TIPS.length)];
    setMascotTip(randomTip);
    setMascotMood('excited');
    setTimeout(() => setMascotMood('happy'), 2000);
  }, []);

  const handleStartAll = () => {
    startAllWorkers();
    setMascotMood('celebrating');
    setTimeout(() => setMascotMood('happy'), 3000);
  };

  const handleStopAll = () => {
    stopAllWorkers();
    setMascotMood('sad' as any);
    setTimeout(() => setMascotMood('happy'), 2000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FloatingShapes shapeCount={6} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>🤖 AI Command Center</Text>
            <Text style={styles.subtitle}>{activeWorkers}/{workers.length} workers active</Text>
          </View>
          <PrinceHaulMascot
            mood={mascotMood}
            size={70}
            onPress={handleMascotPress}
            showSpeechBubble={true}
            speechText={mascotTip}
          />
        </View>

        <TouchableOpacity onPress={() => setExplainerVisible(true)}>
          <Animated.View style={[styles.aiChip, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.aiChipText}>{aiPowered ? '🤖 Claude AI' : '📋 How this works'}</Text>
          </Animated.View>
        </TouchableOpacity>

        {!aiPowered && (
          <TouchableOpacity style={styles.noKeyBanner} onPress={() => navigation.navigate('APIKeys')}>
            <Ionicons name="key-outline" size={18} color={CARTOON_COLORS.charcoal} />
            <Text style={styles.noKeyBannerText}>
              Workers are running on standard logic. Add a free API key to unlock full AI reasoning →
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.metricsRow}>
          <LinearGradient
            colors={CARTOON_COLORS.gradientOcean}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.metricCard}
          >
            <Text style={styles.metricValue}>${totalRevenue.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Daily Revenue Impact</Text>
          </LinearGradient>
          <LinearGradient
            colors={CARTOON_COLORS.gradientForest}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.metricCard}
          >
            <Text style={styles.metricValue}>{activeWorkers}</Text>
            <Text style={styles.metricLabel}>Active Workers</Text>
          </LinearGradient>
          <LinearGradient
            colors={CARTOON_COLORS.gradientSunset}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.metricCard}
          >
            <Text style={styles.metricValue}>{workers.reduce((s, w) => s + w.tasksToday, 0)}</Text>
            <Text style={styles.metricLabel}>Tasks Today</Text>
          </LinearGradient>
        </View>

        <View style={styles.buttonRow}>
          <BouncyButton
            label="▶ Start All"
            onPress={handleStartAll}
            variant="success"
            size="md"
            style={{ flex: 1 }}
          />
          <BouncyButton
            label="⏸ Stop All"
            onPress={handleStopAll}
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
          />
        </View>

        {workers.map((worker) => (
          <View key={worker.id} style={[styles.card, worker.status === 'error' && styles.cardError]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[worker.status] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.workerRole}>{worker.role}</Text>
                  <Text style={styles.heartbeat}>⚡ {formatHeartbeat(worker.lastHeartbeat)}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[worker.status] + '33' }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[worker.status] }]}>
                  {worker.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.workerDesc}>{worker.description}</Text>
            <Text style={styles.aiPoweredBy}>Powered by: {worker.aiPoweredBy}</Text>

            <View style={styles.inlineMetricsRow}>
              <View style={styles.inlineMetric}>
                <Text style={styles.inlineValue}>{worker.tasksToday}</Text>
                <Text style={styles.inlineLabel}>Tasks</Text>
              </View>
              <View style={styles.inlineMetric}>
                <Text style={[styles.inlineValue, { color: CARTOON_COLORS.limeGreen }]}>
                  ${worker.revenueImpact.toLocaleString()}
                </Text>
                <Text style={styles.inlineLabel}>Revenue Impact</Text>
              </View>
            </View>

            <TouchableOpacity
              style={worker.status === 'active' ? styles.stopButton : styles.startButton}
              onPress={() => (worker.status === 'active' ? stopWorker(worker.id) : startWorker(worker.id))}
            >
              <Text style={styles.actionText}>
                {worker.status === 'active' ? '⏸ Pause Worker' : '▶ Resume Worker'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={explainerVisible} animationType="slide" transparent onRequestClose={() => setExplainerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How the AI Workers Work</Text>
              <TouchableOpacity onPress={() => setExplainerVisible(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.modalParagraph}>
                These 10 workers aren't separate apps — they're built into PHI and quietly do real work as you drive:
                booking loads, filing scanned documents, replying on the radio, and watching for nearby freight. Every
                task and dollar shown here comes from something you actually did in the app, not a demo.
              </Text>
              <Text style={styles.modalParagraph}>
                They need a free Anthropic API key to reason like a real dispatcher (Settings {'>'} My API Keys, about
                2 minutes to set up). Without one, they still work using simpler built-in logic — just less smart.
              </Text>
              <Text style={styles.modalParagraph}>
                Tap "Pause Worker" on any card to turn that automation off, or "Start All" to bring the whole team
                back online.
              </Text>
              {workers.map((worker) => (
                <View key={worker.id} style={styles.modalWorkerRow}>
                  <Text style={styles.modalWorkerRole}>{worker.role}</Text>
                  <Text style={styles.modalWorkerDesc}>{worker.description}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerLeft: { flex: 1, marginRight: 12 },
  title: { color: CARTOON_COLORS.charcoal, fontSize: 24, fontWeight: '900' },
  subtitle: { color: CARTOON_COLORS.slate, fontSize: 14, marginTop: 4, fontWeight: '600' },
  aiChip: { backgroundColor: CARTOON_COLORS.sunshineYellow, borderRadius: CARTOON_RADIUS.pill, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginBottom: 8 },
  aiChipText: { color: CARTOON_COLORS.charcoal, fontWeight: '800', fontSize: 12 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, borderRadius: CARTOON_RADIUS.lg, padding: 14, alignItems: 'center', ...CARTOON_SHADOWS.sm },
  metricValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  metricLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, marginTop: 4, textAlign: 'center', fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: CARTOON_RADIUS.lg, padding: 16, gap: 12, ...CARTOON_SHADOWS.sm },
  cardError: { borderWidth: 2, borderColor: '#FF5252' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  workerRole: { color: CARTOON_COLORS.charcoal, fontSize: 14, fontWeight: '800' },
  workerDesc: { color: CARTOON_COLORS.slate, fontSize: 12, lineHeight: 18 },
  aiPoweredBy: { color: CARTOON_COLORS.electricBlue, fontSize: 11, fontWeight: '700' },
  heartbeat: { color: '#8B9DC3', fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: CARTOON_RADIUS.pill, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontWeight: '800', fontSize: 10 },
  inlineMetricsRow: { flexDirection: 'row', gap: 10 },
  inlineMetric: { flex: 1, alignItems: 'center' },
  inlineValue: { color: CARTOON_COLORS.charcoal, fontSize: 18, fontWeight: '800' },
  inlineLabel: { color: '#8B9DC3', fontSize: 11, marginTop: 2 },
  startButton: { backgroundColor: CARTOON_COLORS.limeGreen, padding: 12, borderRadius: CARTOON_RADIUS.md },
  stopButton: { backgroundColor: '#F0F4F8', padding: 12, borderRadius: CARTOON_RADIUS.md, borderWidth: 1, borderColor: '#D0D8E0' },
  actionText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  noKeyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CARTOON_COLORS.sunshineYellow, borderRadius: CARTOON_RADIUS.lg, padding: 12, ...CARTOON_SHADOWS.sm },
  noKeyBannerText: { flex: 1, color: CARTOON_COLORS.charcoal, fontWeight: '700', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#F0F7FF', borderTopLeftRadius: CARTOON_RADIUS.xl, borderTopRightRadius: CARTOON_RADIUS.xl, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: CARTOON_COLORS.charcoal, fontSize: 20, fontWeight: '900' },
  modalParagraph: { color: CARTOON_COLORS.slate, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  modalWorkerRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E0E7FF' },
  modalWorkerRole: { color: CARTOON_COLORS.electricBlue, fontWeight: '800', fontSize: 13 },
  modalWorkerDesc: { color: CARTOON_COLORS.slate, fontSize: 12, marginTop: 2, lineHeight: 17 },
});
