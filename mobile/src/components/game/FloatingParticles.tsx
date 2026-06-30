import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export type ParticleKind = 'dollar' | 'coin' | 'star';

interface FloatingParticlesProps {
  count?: number;
  kinds?: ParticleKind[];
}

const ICONS: Record<ParticleKind, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  dollar: { name: 'logo-usd', color: '#3CCB6A' },
  coin: { name: 'ellipse', color: '#FFD700' },
  star: { name: 'sparkles', color: '#FFF3B0' },
};

function Particle({ kind, left, size, duration, delay }: { kind: ParticleKind; left: number; size: number; duration: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, duration, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -progress.value * 40 },
      { translateX: Math.sin(progress.value * Math.PI) * 10 },
    ],
    opacity: 0.25 + progress.value * 0.55,
  }));

  const icon = ICONS[kind];

  return (
    <Animated.View style={[styles.particle, { left }, style]}>
      <Ionicons name={icon.name} size={size} color={icon.color} />
    </Animated.View>
  );
}

/** Lightweight floating coins/dollar-signs/stars used as ambient background decoration. */
export default function FloatingParticles({ count = 10, kinds = ['dollar', 'coin', 'star'] }: FloatingParticlesProps) {
  const screenWidth = Dimensions.get('window').width;

  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        kind: kinds[i % kinds.length],
        left: Math.random() * (screenWidth - 30),
        top: Math.random() * 100,
        size: 16 + Math.random() * 14,
        duration: 2200 + Math.random() * 1800,
        delay: Math.random() * 1500,
      })),
    [count, kinds, screenWidth],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => (
        <View key={i} style={{ position: 'absolute', top: `${p.top}%` }}>
          <Particle kind={p.kind} left={p.left} size={p.size} duration={p.duration} delay={p.delay} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: { position: 'absolute' },
});
