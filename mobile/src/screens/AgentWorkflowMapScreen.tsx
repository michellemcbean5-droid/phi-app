/**
 * AgentWorkflowMapScreen — Visual AI Agent Lifecycle Map (Phase 11)
 *
 * Shows the full owner-operator business lifecycle as a visual flow:
 *   Stage 1 — Business Setup
 *   Stage 2 — Load Acquisition
 *   Stage 3 — Active Transit
 *   Stage 4 — Post-Delivery & Invoicing
 *   Stage 5 — Business Growth
 *
 * Each stage maps to specific AI agents with their current status,
 * tasks completed today, and handoff connections.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PHI_COLORS } from '../assets/brandColors';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS } from '../theme/cartoonTheme';
import useWorkerStore from '../store/workerStore';

interface LifecycleStage {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradient: readonly [string, string, ...string[]];
  agentIds: string[];
  nextStage?: string;
}

interface AgentDetail {
  workerId: string;
  handoffTo: string[];
  trigger: string;
  output: string;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: 'setup',
    icon: '🏗️',
    title: 'Stage 1 — Business Setup',
    description: 'LLC, authority, insurance, and compliance. One-time foundation before revenue starts.',
    gradient: ['#1A237E', '#283593'],
    agentIds: ['compliance-safety', 'document-manager'],
  },
  {
    id: 'acquisition',
    icon: '🔍',
    title: 'Stage 2 — Load Acquisition',
    description: 'Finding, scoring, and booking the highest-paying freight available.',
    gradient: ['#004D40', '#00695C'],
    agentIds: ['dispatch-coordinator', 'freight-negotiator', 'fleet-maintenance'],
  },
  {
    id: 'transit',
    icon: '🚛',
    title: 'Stage 3 — Active Transit',
    description: 'Truck is rolling. Route optimization, fuel stops, HOS compliance, and real-time tracking.',
    gradient: ['#4A148C', '#6A1B9A'],
    agentIds: ['route-optimizer', 'fuel-optimizer', 'track-trace', 'driver-liaison'],
  },
  {
    id: 'delivery',
    icon: '📦',
    title: 'Stage 4 — Delivery & Invoicing',
    description: 'POD signed, invoice sent instantly, factoring submission, payment tracking.',
    gradient: ['#B71C1C', '#C62828'],
    agentIds: ['invoice-specialist', 'driver-liaison'],
  },
  {
    id: 'growth',
    icon: '📈',
    title: 'Stage 5 — Business Intelligence',
    description: 'P&L analysis, CPM trends, load history, and strategic recommendations.',
    gradient: ['#E65100', '#EF6C00'],
    agentIds: ['business-intelligence', 'track-trace'],
  },
];

const AGENT_DETAILS: Record<string, AgentDetail> = {
  'dispatch-coordinator': {
    workerId: 'dispatch-coordinator',
    handoffTo: ['freight-negotiator', 'route-optimizer'],
    trigger: 'Driver marks "Available for Loads"',
    output: 'Load assignment with broker confirmation',
  },
  'freight-negotiator': {
    workerId: 'freight-negotiator',
    handoffTo: ['dispatch-coordinator', 'compliance-safety'],
    trigger: 'Available load found on board',
    output: 'Negotiated rate + booked load',
  },
  'route-optimizer': {
    workerId: 'route-optimizer',
    handoffTo: ['fuel-optimizer', 'track-trace'],
    trigger: 'Load booked, pickup confirmed',
    output: 'Optimized truck-legal route with rest stops',
  },
  'fuel-optimizer': {
    workerId: 'fuel-optimizer',
    handoffTo: ['track-trace'],
    trigger: 'Route calculated',
    output: 'Fuel stop plan with price-per-gallon',
  },
  'compliance-safety': {
    workerId: 'compliance-safety',
    handoffTo: ['invoice-specialist'],
    trigger: 'Load assigned or HOS threshold approaching',
    output: 'DOT compliance report + HOS warning',
  },
  'invoice-specialist': {
    workerId: 'invoice-specialist',
    handoffTo: ['business-intelligence'],
    trigger: 'Delivery POD signed',
    output: 'Invoice + factoring submission in 60 seconds',
  },
  'track-trace': {
    workerId: 'track-trace',
    handoffTo: ['notification-worker'],
    trigger: 'GPS position updated',
    output: 'Automated ETA updates to broker/shipper',
  },
  'driver-liaison': {
    workerId: 'driver-liaison',
    handoffTo: ['route-optimizer'],
    trigger: 'Pickup appointment or BOL event',
    output: 'Digital BOL + weigh station alerts',
  },
  'fleet-maintenance': {
    workerId: 'fleet-maintenance',
    handoffTo: ['dispatch-coordinator'],
    trigger: 'Mileage threshold or diagnostic event',
    output: 'Maintenance schedule + shop alerts',
  },
  'business-intelligence': {
    workerId: 'business-intelligence',
    handoffTo: ['dispatch-coordinator'],
    trigger: 'Daily revenue calculation',
    output: 'CPM, P&L summary, strategic insights',
  },
};

const STATUS_COLOR: Record<string, string> = {
  active: CARTOON_COLORS.limeGreen,
  idle: '#7F9FCC',
  error: '#FF5252',
};

export default function AgentWorkflowMapScreen() {
  const { workers } = useWorkerStore();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [detailAgent, setDetailAgent] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const getWorker = (id: string) => workers.find((w) => w.id === id);

  const activeCount = workers.filter((w) => w.status === 'active').length;
  const totalTasks = workers.reduce((sum, w) => sum + w.tasksToday, 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#0D47A1', '#1565C0']} style={styles.header}>
          <Text style={styles.headerTitle}>🤖 AI Agent Lifecycle Map</Text>
          <Text style={styles.headerSubtitle}>
            Your 10 AI workers run your trucking business across 5 lifecycle stages — automatically.
          </Text>
          <View style={styles.headerStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active Agents</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalTasks}</Text>
              <Text style={styles.statLabel}>Tasks Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Lifecycle Stages</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Lifecycle Stages */}
        {LIFECYCLE_STAGES.map((stage, stageIdx) => {
          const isExpanded = selectedStage === stage.id;
          const stageAgents = stage.agentIds.map(getWorker).filter(Boolean);
          const activeInStage = stageAgents.filter((w) => w?.status === 'active').length;

          return (
            <View key={stage.id}>
              {/* Connector arrow between stages */}
              {stageIdx > 0 && (
                <View style={styles.connector}>
                  <View style={styles.connectorLine} />
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Ionicons name="arrow-down-circle" size={28} color={PHI_COLORS.sunshineYellow} />
                  </Animated.View>
                  <View style={styles.connectorLine} />
                </View>
              )}

              <TouchableOpacity
                style={styles.stageCard}
                onPress={() => setSelectedStage(isExpanded ? null : stage.id)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={stage.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.stageGradient}
                >
                  <View style={styles.stageLeft}>
                    <Text style={styles.stageIcon}>{stage.icon}</Text>
                    <View style={styles.stageTitleBlock}>
                      <Text style={styles.stageTitle}>{stage.title}</Text>
                      <Text style={styles.stageDesc}>{stage.description}</Text>
                    </View>
                  </View>
                  <View style={styles.stageRight}>
                    <View style={[styles.stageBadge, activeInStage > 0 && styles.stageBadgeActive]}>
                      <View style={[styles.stageDot, { backgroundColor: activeInStage > 0 ? CARTOON_COLORS.limeGreen : '#7F9FCC' }]} />
                      <Text style={styles.stageBadgeText}>{activeInStage}/{stageAgents.length}</Text>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#FFFFFF" />
                  </View>
                </LinearGradient>

                {isExpanded && (
                  <View style={styles.agentGrid}>
                    {stage.agentIds.map((agentId) => {
                      const worker = getWorker(agentId);
                      if (!worker) return null;
                      const detail = AGENT_DETAILS[agentId];
                      return (
                        <TouchableOpacity
                          key={agentId}
                          style={[styles.agentNode, { borderColor: STATUS_COLOR[worker.status] }]}
                          onPress={() => setDetailAgent(agentId)}
                        >
                          <View style={styles.agentNodeTop}>
                            <View style={[styles.agentDot, { backgroundColor: STATUS_COLOR[worker.status] }]} />
                            <Text style={styles.agentRole} numberOfLines={1}>{worker.role}</Text>
                          </View>
                          <Text style={styles.agentTasks}>{worker.tasksToday} tasks today</Text>
                          {detail && (
                            <View style={styles.handoffRow}>
                              <Ionicons name="arrow-forward-outline" size={10} color="#7F9FCC" />
                              <Text style={styles.handoffText} numberOfLines={1}>
                                → {detail.handoffTo.join(', ')}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Agent Status Legend</Text>
          <View style={styles.legendRow}>
            {[
              { color: CARTOON_COLORS.limeGreen, label: 'Active — Working now' },
              { color: '#7F9FCC', label: 'Idle — Waiting for trigger' },
              { color: '#FF5252', label: 'Error — Needs attention' },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Agent Detail Modal */}
      <Modal
        visible={!!detailAgent}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailAgent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {detailAgent && (() => {
              const worker = getWorker(detailAgent);
              const detail = AGENT_DETAILS[detailAgent];
              if (!worker) return null;
              return (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{worker.role}</Text>
                    <TouchableOpacity onPress={() => setDetailAgent(null)}>
                      <Ionicons name="close-circle" size={28} color="#7F9FCC" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalDesc}>{worker.description}</Text>
                  <View style={styles.modalMeta}>
                    <View style={styles.modalMetaItem}>
                      <Text style={styles.modalMetaLabel}>Status</Text>
                      <View style={[styles.modalStatusBadge, { backgroundColor: STATUS_COLOR[worker.status] }]}>
                        <Text style={styles.modalStatusText}>{worker.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.modalMetaItem}>
                      <Text style={styles.modalMetaLabel}>Tasks Today</Text>
                      <Text style={styles.modalMetaValue}>{worker.tasksToday}</Text>
                    </View>
                  </View>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>⚡ Trigger</Text>
                    <Text style={styles.modalSectionText}>{detail?.trigger ?? 'Scheduled or event-driven'}</Text>
                  </View>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>📤 Output</Text>
                    <Text style={styles.modalSectionText}>{detail?.output ?? 'Agent-specific deliverable'}</Text>
                  </View>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🤝 Hands Off To</Text>
                    <Text style={styles.modalSectionText}>{detail?.handoffTo?.join(', ') ?? 'N/A'}</Text>
                  </View>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🤖 Powered By</Text>
                    <Text style={styles.modalSectionText}>{worker.aiPoweredBy}</Text>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  content: { gap: 0, paddingBottom: 32 },
  header: { padding: 24, gap: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  headerSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 20 },
  headerStats: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: PHI_COLORS.sunshineYellow, fontSize: 28, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  connector: { flexDirection: 'column', alignItems: 'center', paddingVertical: 6, gap: 0 },
  connectorLine: { width: 2, height: 10, backgroundColor: PHI_COLORS.sunshineYellow, opacity: 0.4 },
  stageCard: { marginHorizontal: 12, marginVertical: 4, borderRadius: CARTOON_RADIUS.xl, overflow: 'hidden', ...CARTOON_SHADOWS.md },
  stageGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  stageLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stageIcon: { fontSize: 30 },
  stageTitleBlock: { flex: 1 },
  stageTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  stageDesc: { color: 'rgba(255,255,255,0.72)', fontSize: 11, marginTop: 3, lineHeight: 16 },
  stageRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stageBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
  },
  stageBadgeActive: { backgroundColor: 'rgba(0,200,83,0.25)' },
  stageDot: { width: 8, height: 8, borderRadius: 4 },
  stageBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  agentGrid: {
    backgroundColor: '#0D1D35',
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14,
  },
  agentNode: {
    flex: 1, minWidth: '44%', backgroundColor: '#0A1628',
    borderRadius: CARTOON_RADIUS.lg, borderWidth: 1.5, padding: 12, gap: 5,
  },
  agentNodeTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  agentDot: { width: 9, height: 9, borderRadius: 5 },
  agentRole: { color: '#D7E3FF', fontSize: 12, fontWeight: '800', flex: 1 },
  agentTasks: { color: '#7F9FCC', fontSize: 11 },
  handoffRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  handoffText: { color: '#29508C', fontSize: 10, flex: 1 },
  legend: { margin: 12, backgroundColor: '#0D1D35', borderRadius: CARTOON_RADIUS.xl, padding: 16, gap: 12 },
  legendTitle: { color: '#D7E3FF', fontWeight: '900', fontSize: 14 },
  legendRow: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { color: '#7F9FCC', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0D1D35', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', flex: 1 },
  modalDesc: { color: '#7F9FCC', fontSize: 13, lineHeight: 20 },
  modalMeta: { flexDirection: 'row', gap: 16 },
  modalMetaItem: { gap: 4 },
  modalMetaLabel: { color: '#7F9FCC', fontSize: 11, fontWeight: '700' },
  modalMetaValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  modalStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  modalStatusText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  modalSection: { gap: 4 },
  modalSectionTitle: { color: PHI_COLORS.sunshineYellow, fontSize: 12, fontWeight: '800' },
  modalSectionText: { color: '#D7E3FF', fontSize: 13, lineHeight: 18 },
});
