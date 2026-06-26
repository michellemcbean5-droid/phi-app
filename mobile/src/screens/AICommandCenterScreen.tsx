import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHI_COLORS } from '../assets/brandColors';
import useWorkerStore from '../store/workerStore';

const formatHeartbeat = (timestamp: string): string => new Date(timestamp).toLocaleTimeString();

export default function AICommandCenterScreen() {
  const { workers, dailyRevenue, startAllWorkers, stopAllWorkers, startWorker, stopWorker } = useWorkerStore();
  const activeWorkers = workers.filter((worker) => worker.status === 'active').length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>PHI AI Command Center</Text>
        <Text style={styles.subtitle}>{activeWorkers}/15 workers active • ${dailyRevenue.toFixed(0)} revenue impact</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={startAllWorkers}>
            <Text style={styles.primaryButtonText}>Start All Workers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={stopAllWorkers}>
            <Text style={styles.secondaryButtonText}>Stop All Workers</Text>
          </TouchableOpacity>
        </View>

        {workers.map((worker) => (
          <View key={worker.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.heartbeat}>Heartbeat: {formatHeartbeat(worker.lastHeartbeat)}</Text>
              </View>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: worker.status === 'active' ? PHI_COLORS.sunshineYellow : PHI_COLORS.charcoalBlack },
                ]}
              />
            </View>

            <View style={styles.metricsRow}>
              <Text style={styles.metric}>Tasks Today: {worker.tasksToday}</Text>
              <Text style={styles.metric}>Revenue Impact: ${worker.revenueImpact.toFixed(0)}</Text>
            </View>

            <TouchableOpacity
              style={worker.status === 'active' ? styles.stopButton : styles.startButton}
              onPress={() => (worker.status === 'active' ? stopWorker(worker.id) : startWorker(worker.id))}
            >
              <Text style={styles.actionText}>{worker.status === 'active' ? 'Pause Worker' : 'Resume Worker'}</Text>
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
  title: { color: PHI_COLORS.white, fontSize: 28, fontWeight: '800' },
  subtitle: { color: PHI_COLORS.sunshineYellow, fontSize: 14, marginBottom: 8 },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  primaryButton: { flex: 1, backgroundColor: PHI_COLORS.sunshineYellow, padding: 14, borderRadius: 14 },
  secondaryButton: { flex: 1, backgroundColor: PHI_COLORS.card, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: PHI_COLORS.white },
  primaryButtonText: { color: PHI_COLORS.charcoalBlack, textAlign: 'center', fontWeight: '700' },
  secondaryButtonText: { color: PHI_COLORS.white, textAlign: 'center', fontWeight: '700' },
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workerName: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '700' },
  heartbeat: { color: '#C7D7FF', fontSize: 12, marginTop: 4 },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  metricsRow: { gap: 6 },
  metric: { color: PHI_COLORS.white, fontSize: 13 },
  startButton: { backgroundColor: PHI_COLORS.moneyGreen, padding: 12, borderRadius: 12 },
  stopButton: { backgroundColor: PHI_COLORS.charcoalBlack, padding: 12, borderRadius: 12 },
  actionText: { color: PHI_COLORS.white, fontWeight: '700', textAlign: 'center' },
});
