import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { CARTOON_COLORS } from '../../theme/cartoonTheme';

interface ConfettiCelebrationProps {
  trigger?: number;
  particleCount?: number;
  duration?: number;
  onComplete?: () => void;
  style?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

/**
 * ConfettiCelebration — Animated confetti explosion on success events.
 * Trigger the `trigger` prop to fire a celebration.
 */
export default function ConfettiCelebration({
  trigger = 0,
  particleCount = 60,
  duration = 2500,
  onComplete,
  style,
}: ConfettiCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [active, setActive] = useState(false);

  const colors = [
    CARTOON_COLORS.electricBlue,
    CARTOON_COLORS.bubblegumPink,
    CARTOON_COLORS.sunshineYellow,
    CARTOON_COLORS.limeGreen,
    CARTOON_COLORS.electricPurple,
    '#FF8C42',
    '#00FFFF',
    '#FF5252',
  ];

  const generateParticles = useCallback((): Particle[] => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: -20 - Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 10,
      rotation: Math.random() * 360,
      delay: Math.random() * 300,
    }));
  }, [particleCount]);

  useEffect(() => {
    if (trigger > 0) {
      const newParticles = generateParticles();
      setParticles(newParticles);
      setActive(true);
      const timer = setTimeout(() => {
        setActive(false);
        setParticles([]);
        onComplete?.();
      }, duration + 500);
      return () => clearTimeout(timer);
    }
  }, [trigger, generateParticles, duration, onComplete]);

  if (!active || particles.length === 0) return null;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {particles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          particle={particle}
          duration={duration}
        />
      ))}
    </View>
  );
}

interface ConfettiParticleProps {
  particle: Particle;
  duration: number;
}

function ConfettiParticle({ particle, duration }: ConfettiParticleProps) {
  const translateY = useSharedValue(particle.y);
  const translateX = useSharedValue(particle.x);
  const rotate = useSharedValue(particle.rotation);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    const targetY = SCREEN_HEIGHT + 100;
    const driftX = particle.x + (Math.random() - 0.5) * 200;

    scale.value = withDelay(
      particle.delay,
      withSpring(1, { damping: 12, stiffness: 200 })
    );

    translateY.value = withDelay(
      particle.delay,
      withTiming(targetY, {
        duration: duration * (0.6 + Math.random() * 0.4),
        easing: Easing.in(Easing.quad),
      })
    );

    translateX.value = withDelay(
      particle.delay,
      withTiming(driftX, {
        duration: duration,
        easing: Easing.inOut(Easing.sin),
      })
    );

    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotation + 720 + Math.random() * 360, {
        duration: duration,
        easing: Easing.linear,
      })
    );

    opacity.value = withDelay(
      particle.delay + duration * 0.6,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, [translateY, translateX, rotate, opacity, scale, particle, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        styles.particle,
        {
          backgroundColor: particle.color,
          width: particle.size,
          height: particle.size * 0.6,
          borderRadius: particle.size * 0.1,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
  },
});
