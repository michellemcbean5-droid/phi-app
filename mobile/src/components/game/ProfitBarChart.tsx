import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYCOON_COLORS } from '../../assets/brandColors';

interface ProfitBarChartProps {
  values: number[];
  labels?: string[];
  height?: number;
}

const MIN_SCALE = 0.04;
const LABEL_BLOCK_HEIGHT = 17; // barLabel fontSize + marginTop

function Bar({ pct, delay, label, trackHeight }: { pct: number; delay: number; label?: string; trackHeight: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spring-grow on the native driver via scaleY + a compensating translateY
    // so the bar stays anchored to the bottom of its track (no JS-thread height).
    Animated.spring(anim, { toValue: pct, useNativeDriver: true, speed: 12, bounciness: 6, delay }).start();
  }, [anim, delay, pct]);

  const scaleY = anim.interpolate({ inputRange: [0, 100], outputRange: [MIN_SCALE, 1] });
  // transform origin is the bar's center — push it down by half the shrunk
  // height so the bottom edge stays glued to the track floor.
  const translateY = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [(trackHeight * (1 - MIN_SCALE)) / 2, 0],
  });

  return (
    <View style={styles.barColumn}>
      <View style={[styles.barTrack, { height: trackHeight }]}>
        <Animated.View style={[styles.barFill, { transform: [{ translateY }, { scaleY }] }]} />
      </View>
      {label ? <Text style={styles.barLabel}>{label}</Text> : null}
    </View>
  );
}

/** Animated, growing bar chart for profit trends — built from plain Views, no chart library needed. */
export default function ProfitBarChart({ values, labels, height = 110 }: ProfitBarChartProps) {
  const max = Math.max(...values, 1);
  const trackHeight = labels && labels.length > 0 ? height - LABEL_BLOCK_HEIGHT : height;

  return (
    <View>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={16} color={TYCOON_COLORS.moneyGreen} />
        <Text style={styles.headerText}>PROFIT</Text>
      </View>
      <View style={[styles.row, { height }]}>
        {values.map((v, i) => (
          <Bar key={i} pct={(v / max) * 100} delay={i * 80} label={labels?.[i]} trackHeight={trackHeight} />
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
  barTrack: { width: '100%', borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', position: 'relative' },
  barFill: { backgroundColor: TYCOON_COLORS.moneyGreen, borderRadius: 6, width: '100%', height: '100%', position: 'absolute', bottom: 0 },
  barLabel: { color: '#7F9FCC', fontSize: 9, marginTop: 4 },
});
