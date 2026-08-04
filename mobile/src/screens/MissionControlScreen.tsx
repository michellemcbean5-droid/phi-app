/**
 * MissionControlScreen — Live AI Agent Orchestration Map
 *
 * Shows all 15 AI workers as animated nodes with directed edges
 * passing work between them. Tasks run simultaneously with progress bars.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import useWorkerStore from '../store/workerStore';

const { width: SCREEN_W } = Dimensions.get('window');

// Agent node colours by status
const NODE_COLORS = {
  active: PHI_COLORS.moneyGreen,
  idle: '#29508C',
  error: '#FF5252',
  done: '#FFD93D',
};

// Directed edges: [from worker id, to worker id]
const AGENT_EDGES: [string, string][] = [
  ['dispatch-coordinator', 'freight-negotiator'],
  ['freight-negotiator', 'route-optimizer'],
  ['route-optimizer', 'fuel-optimizer'],
  ['freight-negotiator', 'compliance-safety'],
  ['compliance-safety', 'invoice-specialist'],
  ['invoice-specialist', 'profit-analyst'],
  ['route-optimizer', 'track-trace'],
  ['track-trace', 'notification-worker'],
  ['document-manager', 'invoice-specialist'],
  ['profit-analyst', 'dispatch-coordinator'],
];

interface AgentNode {
  id: string;
  role: string;
  status: 'active' | 'idle' | 'error';
  tasksToday: number;
  revenueImpact: number;
  lastHeartbeat: string;
  description: string;
}

interface FlowParticle {
  id: string;
  fromId: string;
  toId: string;
  anim: Animated.Value;
}

let particleCounter = 0;

export default function MissionControlScreen() {
  const { workers, activityLog } = useWorkerStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [particles, setParticles] = useState<FlowParticle[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Spawn a work-flow particle along a random edge every 2s
  const spawnParticle = useCallback(() => {
    const activeEdges = AGENT_EDGES.filter(([from, to]) => {
      const fromW = workers.find((w) => w.id === from);
      const toW = workers.find((w) => w.id === to);
      return fromW?.status === 'active' && toW?.status === 'active';
    });
    if (activeEdges.length === 0) return;

    const [fromId, toId] = activeEdges[Math.floor(Math.random() * activeEdges.length)];
    const anim = new Animated.Value(0);
    const particle: FlowParticle = {
      id: `p-${++particleCounter}`,
      fromId,
      toId,
      anim,
    };

    setParticles((prev) => [...prev.slice(-20), particle]);

    Animated.timing(anim, {
      toValue: 1,
      duration: 1400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setParticles((prev) => prev.filter((p) => p.id !== particle.id));
    });
  }, [workers]);

  useEffect(() => {
    intervalRef.current = setInterval(spawnParticle, 1800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [spawnParticle]);

  const selectedWorker = selectedId ? workers.find((w) => w.id === selectedId) : null;

  const totalActive = workers.filter((w) => w.status === 'active').length;
  const totalTasks = workers.reduce((s, w) => s + w.tasksToday, 0);
  const totalRevenue = workers.reduce((s, w) => s + w.revenueImpact, 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="analytics" size={22} color={PHI_COLORS.sunshineYellow} />
        <Text style={styles.headerTitle}>Mission Control</Text>
        <View style={styles.headerBadge}>
          <View style={[styles.pulse, { backgroundColor: totalActive > 0 ? PHI_COLORS.moneyGreen : '#555' }]} />
          <Text style={styles.headerBadgeText}>{totalActive} LIVE</Text>
        </View>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalActive}/{workers.length}</Text>
          <Text style={styles.summaryLabel}>Agents Active</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: PHI_COLORS.sunshineYellow }]}>{totalTasks}</Text>
          <Text style={styles.summaryLabel}>Tasks Today</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { color: PHI_COLORS.moneyGreen }]}>${totalRevenue.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>Revenue Impact</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Agent Grid — the "map" */}
        <Text style={styles.sectionTitle}>🗺 Agent Network Map</Text>
        <Text style={styles.sectionSub}>Tap any node to inspect. Work flows along edges in real time.</Text>

        <View style={styles.agentGrid}>
          {workers.map((worker) => (
            <AgentNode
              key={worker.id}
              worker={worker}
              selected={selectedId === worker.id}
              onPress={() => setSelectedId((prev) => (prev === worker.id ? null : worker.id))}
            />
          ))}
        </View>

        {/* Edge / flow legend */}
        <View style={styles.edgeLegend}>
          <Text style={styles.edgeLegendTitle}>Active Pipelines</Text>
          {AGENT_EDGES.map(([from, to], i) => {
            const fromW = workers.find((w) => w.id === from);
            const toW = workers.find((w) => w.id === to);
            if (!fromW || !toW) return null;
            const active = fromW.status === 'active' && toW.status === 'active';
            return (
              <View key={i} style={styles.edgeRow}>
                <View style={[styles.edgeDot, { backgroundColor: active ? PHI_COLORS.moneyGreen : '#29508C' }]} />
                <Text style={styles.edgeText} numberOfLines={1}>
                  {fromW.role.replace(/^[^\w]*/, '')} → {toW.role.replace(/^[^\w]*/, '')}
                </Text>
                {active && <Text style={styles.edgeActive}>LIVE</Text>}
              </View>
            );
          })}
        </View>

        {/* Detail panel when node selected */}
        {selectedWorker && (
          <View style={styles.detailPanel}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailRole}>{selectedWorker.role}</Text>
              <View style={[styles.statusBadge, { backgroundColor: NODE_COLORS[selectedWorker.status] + '33' }]}>
                <Text style={[styles.statusText, { color: NODE_COLORS[selectedWorker.status] }]}>
                  {selectedWorker.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.detailDesc}>{selectedWorker.description}</Text>
            <View style={styles.detailMetrics}>
              <View style={styles.detailMetric}>
                <Text style={styles.detailValue}>{selectedWorker.tasksToday}</Text>
                <Text style={styles.detailLabel}>Tasks</Text>
              </View>
              <View style={styles.detailMetric}>
                <Text style={[styles.detailValue, { color: PHI_COLORS.moneyGreen }]}>
                  ${selectedWorker.revenueImpact.toFixed(0)}
                </Text>
                <Text style={styles.detailLabel}>Revenue</Text>
              </View>
            </View>
            {/* Progress bar */}
            <ProgressBar progress={selectedWorker.status === 'active' ? 0.75 : 0} />
          </View>
        )}

        {/* Activity log */}
        <Text style={styles.sectionTitle}>📋 Live Task Feed</Text>
        {activityLog.length === 0 ? (
          <Text style={styles.emptyLog}>No tasks yet — start your workers to see activity here.</Text>
        ) : (
          activityLog.slice(0, 20).map((entry) => (
            <View key={entry.id} style={styles.logRow}>
              <View style={styles.logDot} />
              <Text style={styles.logText} numberOfLines={2}>
                {entry.workerRole} — {entry.summary}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AgentNode({
  worker,
  selected,
  onPress,
}: {
  worker: AgentNode;
  selected: boolean;
  onPress: () => void;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (worker.status === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [worker.status, pulseAnim]);

  const nodeColor = NODE_COLORS[worker.status];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Animated.View
        style={[
          styles.nodeCard,
          { borderColor: nodeColor, transform: [{ scale: pulseAnim }] },
          selected && styles.nodeCardSelected,
        ]}
      >
        <View style={[styles.nodeDot, { backgroundColor: nodeColor }]} />
        <Text style={styles.nodeRole} numberOfLines={2}>
          {worker.role}
        </Text>
        <Text style={styles.nodeTasks}>{worker.tasksToday} tasks</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: progress, duration: 600, useNativeDriver: false }).start();
  }, [progress, anim]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: PHI_COLORS.royalBlue,
  },
  headerTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '900', flex: 1 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulse: { width: 8, height: 8, borderRadius: 4 },
  headerBadgeText: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 12 },
  summaryRow: { flexDirection: 'row', gap: 10, padding: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: PHI_COLORS.card,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  summaryValue: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '900' },
  summaryLabel: { color: '#7F9FCC', fontSize: 10, marginTop: 2 },
  content: { padding: 16, gap: 14 },
  sectionTitle: { color: PHI_COLORS.white, fontSize: 16, fontWeight: '900', marginBottom: 2 },
  sectionSub: { color: '#7F9FCC', fontSize: 12, marginBottom: 10 },
  agentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  nodeCard: {
    width: (SCREEN_W - 52) / 3,
    backgroundColor: PHI_COLORS.card,
    borderRadius: 14,
    padding: 10,
    borderWidth: 2,
    alignItems: 'center',
    gap: 4,
  },
  nodeCardSelected: { backgroundColor: '#0D2A50' },
  nodeDot: { width: 10, height: 10, borderRadius: 5 },
  nodeRole: {
    color: PHI_COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
  nodeTasks: { color: '#7F9FCC', fontSize: 9 },
  edgeLegend: { backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 14, gap: 8 },
  edgeLegendTitle: { color: PHI_COLORS.sunshineYellow, fontWeight: '800', fontSize: 13, marginBottom: 4 },
  edgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  edgeDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  edgeText: { color: '#D7E3FF', fontSize: 12, flex: 1 },
  edgeActive: { color: PHI_COLORS.moneyGreen, fontWeight: '800', fontSize: 10 },
  detailPanel: {
    backgroundColor: '#0D2A50',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: PHI_COLORS.royalBlue,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailRole: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 15, flex: 1 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontWeight: '800', fontSize: 10 },
  detailDesc: { color: '#D7E3FF', fontSize: 12, lineHeight: 18 },
  detailMetrics: { flexDirection: 'row', gap: 14 },
  detailMetric: { alignItems: 'center' },
  detailValue: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 20 },
  detailLabel: { color: '#7F9FCC', fontSize: 10, marginTop: 2 },
  progressTrack: {
    height: 6,
    backgroundColor: '#1A2B45',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: PHI_COLORS.moneyGreen,
    borderRadius: 3,
  },
  logRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  logDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PHI_COLORS.moneyGreen,
    marginTop: 6,
    flexShrink: 0,
  },
  logText: { color: '#D7E3FF', fontSize: 12, lineHeight: 17, flex: 1 },
  emptyLog: { color: '#7F9FCC', fontSize: 12, textAlign: 'center', paddingVertical: 16 },
});
