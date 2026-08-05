// Premium load card — minimal text, icon-first design with color-coded tiers.
// Supports swipe-to-book gesture via AnimatedPressable.

import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CARTOON_COLORS, CARTOON_SHADOWS, CARTOON_RADIUS } from '../theme/cartoonTheme';
import AnimatedPressable from './game/AnimatedPressable';
import { Load } from '../workers/workers-15x';
import { scoreLoad } from '../workers/LoadScoringWorker';
import { getBrokerReliabilityLabel } from '../api/aiService';

interface Props {
  load: Load;
  onPress: (load: Load) => void;
  onBook?: (load: Load) => void;
}

const TIER_GRADIENT: Record<string, readonly [string, string]> = {
  Diamond: ['#00C6FF', '#0057FF'] as const,
  Gold: ['#FFD93D', '#FF8C00'] as const,
  Standard: ['#2A3B5C', '#1A2840'] as const,
};

const TIER_BADGE_COLOR: Record<string, string> = {
  Diamond: '#00EEFF',
  Gold: '#FFD93D',
  Standard: '#8899CC',
};

const SOURCE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  DAT: 'radio-outline',
  Truckstop: 'car-outline',
  AmazonRelay: 'logo-amazon',
  Coyote: 'paw-outline',
  Loadsmart: 'flash-outline',
};

const SOURCE_COLORS: Record<string, string> = {
  DAT: '#FF8C42',
  Truckstop: '#00C853',
  AmazonRelay: '#FFD93D',
  Coyote: '#9B59B6',
  Loadsmart: '#00B0FF',
};

function LoadCard({ load, onPress, onBook }: Props): React.JSX.Element {
  const tier = (() => {
    try { return scoreLoad(load); } catch { return 'Standard' as const; }
  })();
  const gradient = TIER_GRADIENT[tier] ?? TIER_GRADIENT['Standard'];
  const brokerBadge = getBrokerReliabilityLabel(load.brokerRating);
  const sourceIcon = SOURCE_ICONS[load.source] ?? 'cube-outline';
  const sourceColor = SOURCE_COLORS[load.source] ?? '#8899CC';

  return (
    <AnimatedPressable onPress={() => onPress(load)} style={styles.wrapper}>
      <LinearGradient
        colors={['#0D1F3C', '#0A1628']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Tier accent bar */}
        <LinearGradient
          colors={gradient}
          style={styles.accentBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              {load.origin.city}, {load.origin.state}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#6B82A8" style={styles.arrow} />
            <Text style={styles.routeText}>
              {load.destination.city}, {load.destination.state}
            </Text>
          </View>
          <View style={[styles.tierBadge, { borderColor: TIER_BADGE_COLOR[tier] }]}>
            <Text style={[styles.tierText, { color: TIER_BADGE_COLOR[tier] }]}>{tier}</Text>
          </View>
        </View>

        {/* KPI row */}
        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Text style={styles.kpiValue}>${load.rate.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Rate</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpi}>
            <Text style={[styles.kpiValue, styles.rpmValue]}>${load.rpm.toFixed(2)}</Text>
            <Text style={styles.kpiLabel}>RPM</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpi}>
            <Text style={styles.kpiValue}>{load.miles.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Miles</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpi}>
            <Text style={styles.kpiValue}>{load.equipmentType.split(' ')[0]}</Text>
            <Text style={styles.kpiLabel}>Type</Text>
          </View>
        </View>

        {/* Footer row */}
        <View style={styles.footerRow}>
          <View style={styles.sourceTag}>
            <Ionicons name={sourceIcon} size={12} color={sourceColor} />
            <Text style={[styles.sourceText, { color: sourceColor }]}>{load.source}</Text>
          </View>
          <View style={styles.brokerRow}>
            <Ionicons
              name={brokerBadge.icon as keyof typeof Ionicons.glyphMap}
              size={12}
              color={brokerBadge.color}
            />
            <Text style={[styles.brokerText, { color: brokerBadge.color }]}>
              {load.brokerRating.toFixed(1)} · {brokerBadge.label}
            </Text>
          </View>
          {onBook && (
            <AnimatedPressable
              onPress={() => onBook(load)}
              style={[styles.bookBtn, { backgroundColor: gradient[0] }]}
            >
              <Text style={styles.bookText}>Book</Text>
            </AnimatedPressable>
          )}
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginVertical: 6 },
  card: {
    borderRadius: CARTOON_RADIUS.lg,
    overflow: 'hidden',
    ...CARTOON_SHADOWS.md,
  },
  accentBar: { height: 3 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  routeInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' },
  routeText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  arrow: { marginHorizontal: 4 },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  kpi: { flex: 1, alignItems: 'center' },
  kpiValue: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  rpmValue: { color: CARTOON_COLORS.moneyGreen },
  kpiLabel: { fontSize: 10, color: '#6B82A8', marginTop: 2, fontWeight: '600' },
  kpiDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  sourceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sourceText: { fontSize: 11, fontWeight: '700' },
  brokerRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1 },
  brokerText: { fontSize: 11, fontWeight: '600' },
  bookBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bookText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});

export default memo(LoadCard);
