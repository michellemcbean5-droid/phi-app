import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { isClaudeConfigured } from '../api/claudeClient';
import useWorkerStore from '../store/workerStore';
import useDriverPrefsStore from '../store/driverPrefsStore';
import usePHIOrchestratorStore, { PipelineStage } from '../store/phiOrchestratorStore';
import { RootStackParamList } from '../navigation/RootNavigator';

type AICommandCenterNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STAGE_LABELS: Record<PipelineStage, string> = {
  idle: 'PHI Brain',
  'hos-filter': 'Compliance Officer',
  'route-calc': 'Route Optimizer',
  'fuel-optimize': 'Fuel Optimizer',
  'broker-verify': 'Freight Negotiator',
  booking: 'Dispatch Coordinator',
};

/** Which single worker id lights up while the pipeline is on a given stage. */
const STAGE_OWNER_WORKER_ID: Partial<Record<PipelineStage, string>> = {
  'hos-filter': 'compliance-safety',
  'route-calc': 'route-optimizer',
  'fuel-optimize': 'fuel-optimizer',
  'broker-verify': 'freight-negotiator',
  booking: 'dispatch-coordinator',
};

const formatLogTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function AICommandCenterScreen() {
  const navigation = useNavigation<AICommandCenterNavigationProp>();
  const { workers, dailyRevenue, startAllWorkers, stopAllWorkers } = useWorkerStore();
  const { prefs, updatePref } = useDriverPrefsStore();
  const { currentStage, log } = usePHIOrchestratorStore();
  const aiPowered = isClaudeConfigured();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [explainerVisible, setExplainerVisible] = useState(false);
  const [healthExpanded, setHealthExpanded] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const totalRevenue = workers.reduce((sum, w) => sum + w.revenueImpact, 0);
  const totalTasks = workers.reduce((sum, w) => sum + w.tasksToday, 0);

  // Sub-systems have no independent on/off of their own — they always mirror the
  // single Master Auto-Pilot switch, wherever it was flipped (here or onboarding).
  useEffect(() => {
    if (prefs.autoBookEnabled) {
      startAllWorkers();
    } else {
      stopAllWorkers();
    }
  }, [prefs.autoBookEnabled, startAllWorkers, stopAllWorkers]);

  const handleToggleAutoPilot = (enabled: boolean): void => {
    updatePref('autoBookEnabled', enabled);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>AI Command Center</Text>
            <Text style={styles.subtitle}>The PHI Brain — one pipeline, not nine separate workers</Text>
          </View>
          <TouchableOpacity onPress={() => setExplainerVisible(true)}>
            <Ionicons name="information-circle-outline" size={26} color={PHI_COLORS.white} />
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

        <View style={styles.masterCard}>
          <View style={styles.masterTextWrap}>
            <Text style={styles.masterTitle}>Master Auto-Pilot</Text>
            <Text style={styles.masterSubtitle}>
              {prefs.autoBookEnabled
                ? 'PHI is booking qualifying loads automatically while the app is open.'
                : 'Off — review and tap Book Load yourself on the Loads tab.'}
            </Text>
          </View>
          <Switch
            value={prefs.autoBookEnabled}
            onValueChange={handleToggleAutoPilot}
            thumbColor={prefs.autoBookEnabled ? PHI_COLORS.sunshineYellow : '#B0B0B0'}
            trackColor={{ false: '#2A3F66', true: PHI_COLORS.sunshineYellow + '66' }}
          />
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>${totalRevenue.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Daily Revenue Impact</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalTasks}</Text>
            <Text style={styles.metricLabel}>Tasks Today</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{STAGE_LABELS[currentStage]}</Text>
            <Text style={styles.metricLabel}>Current Stage</Text>
          </View>
        </View>

        <View style={styles.streamCard}>
          <Text style={styles.streamTitle}>Live Operations Stream</Text>
          {log.length === 0 ? (
            <Text style={styles.streamEmpty}>
              No activity yet — book a load or turn on Master Auto-Pilot to watch the PHI Brain work in real time.
            </Text>
          ) : (
            log.slice(0, 60).map((entry) => (
              <View key={entry.id} style={styles.streamRow}>
                <View
                  style={[
                    styles.streamDot,
                    entry.outcome === 'pass'
                      ? { backgroundColor: PHI_COLORS.moneyGreen }
                      : entry.outcome === 'rejected'
                        ? { backgroundColor: PHI_COLORS.sunshineYellow }
                        : { backgroundColor: '#FF5252' },
                  ]}
                />
                <Text style={styles.streamText}>
                  <Text style={styles.streamTime}>{formatLogTime(entry.timestamp)} — </Text>
                  <Text style={styles.streamBold}>{STAGE_LABELS[entry.stage]}: </Text>
                  {entry.message}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.accordionHeader} onPress={() => setHealthExpanded((v) => !v)}>
          <Text style={styles.accordionTitle}>Sub-system Health Monitoring</Text>
          <Ionicons name={healthExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={PHI_COLORS.white} />
        </TouchableOpacity>

        {healthExpanded && (
          <View style={styles.accordionBody}>
            {workers.map((worker) => {
              const isCurrentStageOwner = STAGE_OWNER_WORKER_ID[currentStage] === worker.id;
              const isOn = worker.status === 'active';
              return (
                <View key={worker.id} style={styles.healthRow}>
                  <Animated.View
                    style={[
                      styles.healthDot,
                      { backgroundColor: isOn ? PHI_COLORS.moneyGreen : '#5A6A85' },
                      isCurrentStageOwner && isOn ? { transform: [{ scale: pulseAnim }] } : null,
                    ]}
                  />
                  <Text style={styles.healthRole}>{worker.role}</Text>
                  <Text style={styles.healthStatus}>{isOn ? (isCurrentStageOwner ? 'Active' : 'Idling') : 'Paused'}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={explainerVisible} animationType="slide" transparent onRequestClose={() => setExplainerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How the PHI Brain Works</Text>
              <TouchableOpacity onPress={() => setExplainerVisible(false)}>
                <Ionicons name="close" size={24} color={PHI_COLORS.white} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.modalParagraph}>
                PHI used to run 10 separate AI workers that each managed their own on/off state. Now there's one
                deterministic pipeline: every load is checked in the same strict order — HOS compliance, route,
                fuel cost, broker credit, then booking. A load has to clear each stage before moving to the next;
                nothing runs in parallel or competes for the same load.
              </Text>
              <Text style={styles.modalParagraph}>
                Turn on Master Auto-Pilot above and PHI runs that pipeline on your best-scoring loads automatically
                while the app is open. Leave it off and you stay in control — tap "Book Load" on the Loads tab and
                the same pipeline runs for just that one load.
              </Text>
              <Text style={styles.modalParagraph}>
                On the Free plan, the pipeline reasons like a real dispatcher once you add a free AI API key
                (Settings {'>'} My API Keys). Without one, it still runs on simpler built-in logic — just less smart.
              </Text>
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
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 14, alignItems: 'center' },
  metricValue: { color: PHI_COLORS.white, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  metricLabel: { color: '#A8B7D8', fontSize: 10, marginTop: 4, textAlign: 'center' },
  noKeyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, padding: 12 },
  noKeyBannerText: { flex: 1, color: PHI_COLORS.charcoalBlack, fontWeight: '700', fontSize: 12 },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PHI_COLORS.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: PHI_COLORS.sunshineYellow,
    gap: 12,
  },
  masterTextWrap: { flex: 1, gap: 4 },
  masterTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '900' },
  masterSubtitle: { color: '#C7D7FF', fontSize: 12, lineHeight: 17 },
  streamCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10 },
  streamTitle: { color: PHI_COLORS.white, fontSize: 16, fontWeight: '800' },
  streamEmpty: { color: '#A8B7D8', fontSize: 13, lineHeight: 19 },
  streamRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  streamDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  streamText: { flex: 1, color: '#D7E3FF', fontSize: 12, lineHeight: 18 },
  streamTime: { color: '#7F9FCC' },
  streamBold: { fontWeight: '800', color: PHI_COLORS.white },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PHI_COLORS.card,
    borderRadius: 14,
    padding: 14,
  },
  accordionTitle: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 14 },
  accordionBody: { backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 14, gap: 10, marginTop: -6 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  healthDot: { width: 9, height: 9, borderRadius: 5 },
  healthRole: { flex: 1, color: '#D7E3FF', fontSize: 13 },
  healthStatus: { color: '#7F9FCC', fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: PHI_COLORS.royalBlue, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '900' },
  modalParagraph: { color: '#D7E3FF', fontSize: 14, lineHeight: 21, marginBottom: 12 },
});
