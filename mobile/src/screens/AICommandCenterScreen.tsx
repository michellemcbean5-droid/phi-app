import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHI_COLORS } from '../assets/brandColors';
import { isClaudeConfigured } from '../api/claudeClient';
import useWorkerStore from '../store/workerStore';

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
  const { workers, dailyRevenue, startAllWorkers, stopAllWorkers, startWorker, stopWorker, updateHeartbeat } =
    useWorkerStore();
  const activeWorkers = workers.filter((w) => w.status === 'active').length;
  const aiPowered = isClaudeConfigured();
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
          <View>
            <Text style={styles.title}>PHI AI Command Center</Text>
            <Text style={styles.subtitle}>{activeWorkers}/15 workers active</Text>
          </View>
          <Animated.View style={[styles.aiChip, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.aiChipText}>{aiPowered ? '🤖 Claude AI' : '📋 Standard'}</Text>
          </Animated.View>
        </View>

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
                <View>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.heartbeat}>⚡ {formatHeartbeat(worker.lastHeartbeat)}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[worker.status] + '33' }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[worker.status] }]}>
                  {worker.status.toUpperCase()}
                </Text>
              </View>
            </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.royalBlue },
  content: { padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { color: PHI_COLORS.white, fontSize: 24, fontWeight: '800' },
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
  workerName: { color: PHI_COLORS.white, fontSize: 15, fontWeight: '700' },
  heartbeat: { color: '#C7D7FF', fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontWeight: '800', fontSize: 10 },
  inlineMetric: { flex: 1, alignItems: 'center' },
  inlineValue: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800' },
  inlineLabel: { color: '#A8B7D8', fontSize: 11, marginTop: 2 },
  startButton: { backgroundColor: PHI_COLORS.moneyGreen, padding: 12, borderRadius: 12 },
  stopButton: { backgroundColor: '#1A2B45', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#3D5A8A' },
  actionText: { color: PHI_COLORS.white, fontWeight: '700', textAlign: 'center' },
});
