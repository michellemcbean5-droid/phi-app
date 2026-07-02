import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
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
  active: PHI_COLORS.moneyGreen,
  idle: '#7F8FB3',
  error: '#FF5252',
} as const;

export default function AICommandCenterScreen() {
  const navigation = useNavigation<AICommandCenterNavigationProp>();
  const { workers, dailyRevenue, startAllWorkers, stopAllWorkers, startWorker, stopWorker, updateHeartbeat } =
    useWorkerStore();
  const activeWorkers = workers.filter((w) => w.status === 'active').length;
  const aiPowered = isClaudeConfigured();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [explainerVisible, setExplainerVisible] = useState(false);

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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>AI Command Center</Text>
            <Text style={styles.subtitle}>{activeWorkers}/{workers.length} workers active</Text>
          </View>
          <TouchableOpacity onPress={() => setExplainerVisible(true)}>
            <Animated.View style={[styles.aiChip, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.aiChipText}>{aiPowered ? '🤖 Claude AI' : '📋 How this works'}</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {!aiPowered && (
          <TouchableOpacity style={styles.noKeyBanner} onPress={() => navigation.navigate('APIKeys')}>
            <Ionicons name="key-outline" size={18} color={PHI_COLORS.charcoalBlack} />
            <Text style={styles.noKeyBannerText}>
              Workers are running on standard logic. Add a free API key to unlock full AI reasoning →
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>${totalRevenue.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Daily Revenue Impact</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{activeWorkers}</Text>
            <Text style={styles.metricLabel}>Active Workers</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{workers.reduce((s, w) => s + w.tasksToday, 0)}</Text>
            <Text style={styles.metricLabel}>Tasks Today</Text>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={startAllWorkers}>
            <Text style={styles.primaryButtonText}>▶ Start All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={stopAllWorkers}>
            <Text style={styles.secondaryButtonText}>⏸ Stop All</Text>
          </TouchableOpacity>
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

            <View style={styles.metricsRow}>
              <View style={styles.inlineMetric}>
                <Text style={styles.inlineValue}>{worker.tasksToday}</Text>
                <Text style={styles.inlineLabel}>Tasks</Text>
              </View>
              <View style={styles.inlineMetric}>
                <Text style={[styles.inlineValue, { color: PHI_COLORS.moneyGreen }]}>
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
                <Ionicons name="close" size={24} color={PHI_COLORS.white} />
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
  container: { flex: 1, backgroundColor: PHI_COLORS.royalBlue },
  content: { padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 },
  headerTextWrap: { flexShrink: 1 },
  title: { color: PHI_COLORS.white, fontSize: 22, fontWeight: '800' },
  subtitle: { color: PHI_COLORS.sunshineYellow, fontSize: 13, marginTop: 4 },
  aiChip: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  aiChipText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 12 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 14, alignItems: 'center' },
  metricValue: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '900' },
  metricLabel: { color: '#A8B7D8', fontSize: 10, marginTop: 4, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1, backgroundColor: PHI_COLORS.sunshineYellow, padding: 14, borderRadius: 14 },
  secondaryButton: { flex: 1, backgroundColor: PHI_COLORS.card, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: PHI_COLORS.white },
  primaryButtonText: { color: PHI_COLORS.charcoalBlack, textAlign: 'center', fontWeight: '800' },
  secondaryButtonText: { color: PHI_COLORS.white, textAlign: 'center', fontWeight: '700' },
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 12 },
  cardError: { borderWidth: 1, borderColor: '#FF5252' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  workerRole: { color: PHI_COLORS.white, fontSize: 14, fontWeight: '800' },
  workerDesc: { color: '#A8B7D8', fontSize: 12, lineHeight: 18 },
  aiPoweredBy: { color: PHI_COLORS.sunshineYellow, fontSize: 11, fontWeight: '700' },
  heartbeat: { color: '#C7D7FF', fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontWeight: '800', fontSize: 10 },
  inlineMetric: { flex: 1, alignItems: 'center' },
  inlineValue: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800' },
  inlineLabel: { color: '#A8B7D8', fontSize: 11, marginTop: 2 },
  startButton: { backgroundColor: PHI_COLORS.moneyGreen, padding: 12, borderRadius: 12 },
  stopButton: { backgroundColor: '#1A2B45', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#3D5A8A' },
  actionText: { color: PHI_COLORS.white, fontWeight: '700', textAlign: 'center' },
  noKeyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, padding: 12 },
  noKeyBannerText: { flex: 1, color: PHI_COLORS.charcoalBlack, fontWeight: '700', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: PHI_COLORS.royalBlue, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '900' },
  modalParagraph: { color: '#D7E3FF', fontSize: 14, lineHeight: 21, marginBottom: 12 },
  modalWorkerRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#1E3A62' },
  modalWorkerRole: { color: PHI_COLORS.sunshineYellow, fontWeight: '800', fontSize: 13 },
  modalWorkerDesc: { color: '#C7D7FF', fontSize: 12, marginTop: 2, lineHeight: 17 },
});
