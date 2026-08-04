// Load Board Status screen — shows health of all 4 load board connectors.
// Accessible from Settings → Load Board Status.

import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PHI_COLORS } from '../assets/brandColors';
import { CARTOON_RADIUS, CARTOON_SHADOWS } from '../theme/cartoonTheme';
import { getHealth, ConnectorHealth } from '../utils/connectorHealth';
import { aggregateLoads } from '../workers/LoadFinderWorker';

const STATUS_STYLES: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  healthy: { color: '#00C853', icon: 'checkmark-circle', label: 'Live' },
  degraded: { color: '#FFD93D', icon: 'warning', label: 'Degraded' },
  down: { color: '#FF5252', icon: 'close-circle', label: 'Down' },
  unknown: { color: '#6B82A8', icon: 'help-circle', label: 'Not checked' },
};

const BOARD_DESCRIPTIONS: Record<string, string> = {
  DAT: 'DAT Freight & Analytics — largest carrier portal in North America',
  Truckstop: 'Truckstop.com — 45K+ loads daily from verified brokers',
  AmazonRelay: 'Amazon Relay — direct Amazon shipper loads, no broker markup',
  Coyote: 'Coyote Logistics — UPS subsidiary, 10K+ loads per day',
};

export default function LoadBoardStatusScreen() {
  const [health, setHealth] = useState<ConnectorHealth[]>(getHealth());
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const refresh = async () => {
    setRefreshing(true);
    try {
      await aggregateLoads();
      setHealth(getHealth());
      setLastRefreshed(new Date().toLocaleTimeString());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={PHI_COLORS.royalBlue} />}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.subtitle}>
          {lastRefreshed ? 'Last refreshed ' + lastRefreshed : 'Pull to refresh'}
        </Text>

        {health.map((connector) => {
          const statusStyle = STATUS_STYLES[connector.status] ?? STATUS_STYLES.unknown;
          return (
            <LinearGradient
              key={connector.name}
              colors={['#0D1F3C', '#0A1628']}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={styles.nameRow}>
                  <View style={[styles.dot, { backgroundColor: statusStyle.color }]} />
                  <Text style={styles.boardName}>{connector.name}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
                  <Text style={[styles.statusLabel, { color: statusStyle.color }]}>
                    {statusStyle.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.description}>
                {BOARD_DESCRIPTIONS[connector.name] ?? connector.name}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{connector.successCount}</Text>
                  <Text style={styles.statLabel}>Successes</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, connector.failureCount > 0 && { color: '#FF5252' }]}>
                    {connector.failureCount}
                  </Text>
                  <Text style={styles.statLabel}>Failures</Text>
                </View>
                {connector.lastChecked && (
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>
                      {new Date(connector.lastChecked).toLocaleTimeString()}
                    </Text>
                    <Text style={styles.statLabel}>Last Check</Text>
                  </View>
                )}
              </View>
              {connector.lastError && (
                <Text style={styles.errorText} numberOfLines={2}>
                  ⚠ {connector.lastError}
                </Text>
              )}
            </LinearGradient>
          );
        })}

        <Text style={styles.hint}>
          Tap a connector in Settings → API Keys to add credentials and go live.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 12 },
  subtitle: { color: '#6B82A8', fontSize: 12, textAlign: 'center', marginBottom: 4 },
  card: {
    borderRadius: CARTOON_RADIUS.lg,
    padding: 16,
    ...CARTOON_SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  boardName: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusLabel: { fontSize: 12, fontWeight: '700' },
  description: { color: '#8899CC', fontSize: 12, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 20 },
  stat: {},
  statValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  statLabel: { color: '#6B82A8', fontSize: 11, marginTop: 1 },
  errorText: { color: '#FF8888', fontSize: 11, marginTop: 8 },
  hint: { color: '#6B82A8', fontSize: 12, textAlign: 'center', marginTop: 8, fontStyle: 'italic' },
});
