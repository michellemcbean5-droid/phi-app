import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYCOON_COLORS } from '../../assets/brandColors';

interface ProfitBarChartProps {
  values: number[];
  labels?: string[];
  height?: number;
}

function Bar({ pct, delay, label }: { pct: number; delay: number; label?: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 700, delay, useNativeDriver: false }).start();
  }, [anim, delay, pct]);

  const heightPct = anim.interpolate({ inputRange: [0, 100], outputRange: ['4%', '100%'] });

  return (
    <View style={styles.barColumn}>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { height: heightPct }]} />
      </View>
      {label ? <Text style={styles.barLabel}>{label}</Text> : null}
    </View>
  );
}

/** Animated, growing bar chart for profit trends — built from plain Views, no chart library needed. */
export default function ProfitBarChart({ values, labels, height = 110 }: ProfitBarChartProps) {
  const max = Math.max(...values, 1);

  return (
    <View>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={16} color={TYCOON_COLORS.moneyGreen} />
        <Text style={styles.headerText}>PROFIT</Text>
      </View>
      <View style={[styles.row, { height }]}>
        {values.map((v, i) => (
          <Bar key={i} pct={(v / max) * 100} delay={i * 80} label={labels?.[i]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  headerText: { color: TYCOON_COLORS.moneyGreen, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: '100%', flex: 1, justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)' },
  barFill: { backgroundColor: TYCOON_COLORS.moneyGreen, borderRadius: 6, width: '100%' },
  barLabel: { color: '#7F9FCC', fontSize: 9, marginTop: 4 },
});
