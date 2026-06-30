import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { TYCOON_COLORS } from '../../assets/brandColors';

interface EfficiencyDialProps {
  value: number; // 0-100
  label?: string;
  size?: number;
}

const TICK_COUNT = 20;

function tickColor(positionPct: number): string {
  if (positionPct < 40) return '#FF5050';
  if (positionPct < 70) return TYCOON_COLORS.gold;
  return TYCOON_COLORS.moneyGreen;
}

/** Speedometer-style gauge built from trig-positioned tick marks + a pivoted needle — no SVG dependency. */
export default function EfficiencyDial({ value, label = 'EFFICIENCY', size = 160 }: EfficiencyDialProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const needleAnim = useRef(new Animated.Value(0)).current;
  const radius = size / 2;

  useEffect(() => {
    Animated.timing(needleAnim, { toValue: clamped, duration: 900, useNativeDriver: true }).start();
  }, [clamped, needleAnim]);

  const needleRotate = needleAnim.interpolate({ inputRange: [0, 100], outputRange: ['-90deg', '90deg'] });

  const ticks = useMemo(() => {
    const tickRadius = radius - 12;
    return Array.from({ length: TICK_COUNT + 1 }).map((_, i) => {
      const pct = (i / TICK_COUNT) * 100;
      const theta = (-90 + (i / TICK_COUNT) * 180) * (Math.PI / 180);
      const x = radius + tickRadius * Math.sin(theta);
      const y = radius - tickRadius * Math.cos(theta);
      const angleDeg = -90 + (i / TICK_COUNT) * 180;
      return { pct, x, y, angleDeg };
    });
  }, [radius]);

  return (
    <View style={[styles.wrap, { width: size, height: radius + 28 }]}>
      <View style={[styles.face, { width: size, height: radius, borderTopLeftRadius: radius, borderTopRightRadius: radius }]}>
        {ticks.map((t, i) => (
          <View
            key={i}
            style={[
              styles.tick,
              {
                left: t.x - 1.5,
                top: t.y - 6,
                backgroundColor: t.pct <= clamped ? tickColor(t.pct) : 'rgba(255,255,255,0.15)',
                transform: [{ rotate: `${t.angleDeg}deg` }],
              },
            ]}
          />
        ))}
        <View style={[styles.needlePivot, { left: radius, top: radius }]}>
          <Animated.View style={{ transform: [{ rotate: needleRotate }] }}>
            <View style={[styles.needle, { height: radius - 18 }]} />
          </Animated.View>
        </View>
        <View style={[styles.hub, { left: radius - 8 }]} />
      </View>
      <Text style={styles.value}>{Math.round(clamped)}%</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  face: {
    backgroundColor: '#0A1F3D',
    borderWidth: 2,
    borderColor: '#1E3A62',
    borderBottomWidth: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  needlePivot: { position: 'absolute', width: 0, height: 0 },
  needle: {
    position: 'absolute',
    bottom: 0,
    left: -2,
    width: 4,
    borderRadius: 2,
    backgroundColor: TYCOON_COLORS.gold,
  },
  hub: {
    position: 'absolute',
    bottom: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: TYCOON_COLORS.gold,
    borderWidth: 2,
    borderColor: '#0A1F3D',
  },
  value: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 10 },
  label: { color: '#7F9FCC', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 2 },
});
