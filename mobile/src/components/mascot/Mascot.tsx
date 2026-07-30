import React, { useEffect, useRef, useState } from 'react';
import { Animated, TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { CARTOON_COLORS } from '../../theme/cartoonTheme';

export type MascotMood = 'happy' | 'thinking' | 'celebrating' | 'warning' | 'sad';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  onPress?: () => void;
}

/**
 * 👑 Prince Haul — the royal truck driver mascot for phi-app.
 * Bounces on entry, wiggles on tap, and changes expression based on mood.
 */
export default function Mascot({ mood = 'happy', size = 80, onPress }: MascotProps) {
  const bounce = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const [wiggleSeq, setWiggleSeq] = useState(0);

  // Entry bounce animation
  useEffect(() => {
    Animated.spring(bounce, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 100 }).start();
  }, [bounce, scale]);

  // Wiggle on tap
  const handlePress = () => {
    setWiggleSeq((s) => s + 1);
    Animated.sequence([
      Animated.timing(wiggle, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start(() => onPress?.());
  };

  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });
  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [size, 0] });

  const eyeExpression = getEyeExpression(mood);
  const mouthExpression = getMouthExpression(mood);
  const crownColor = mood === 'celebrating' ? '#FFD700' : mood === 'warning' ? '#FF5252' : '#FFD93D';
  const bodyColor = mood === 'sad' ? '#7F9FCC' : '#3B82F6';

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.container, { width: size, height: size }]} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.mascot,
          {
            width: size,
            height: size,
            transform: [{ translateY }, { scale }, { rotate }],
          },
        ]}
      >
        {/* Crown */}
        <View style={[styles.crown, { borderBottomColor: crownColor, top: -size * 0.15, left: size * 0.2 }]} />
        {/* Body */}
        <View style={[styles.body, { backgroundColor: bodyColor, width: size * 0.7, height: size * 0.6, borderRadius: size * 0.35 }]} />
        {/* Eyes */}
        <View style={[styles.eye, { left: size * 0.3, top: size * 0.35 }]} />
        <View style={[styles.eye, { right: size * 0.3, top: size * 0.35 }]} />
        {/* Eye expressions */}
        <View style={[styles.eyeExpression, { left: size * 0.32, top: size * 0.38 }]} />
        <View style={[styles.eyeExpression, { right: size * 0.32, top: size * 0.38 }]} />
        {/* Mouth */}
        <View style={[styles.mouth, mouthExpression, { top: size * 0.52, left: size * 0.35 }]} />
        {/* Truck emblem */}
        <View style={[styles.emblem, { top: size * 0.65, left: size * 0.42 }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function getEyeExpression(mood: MascotMood): { backgroundColor: string } {
  switch (mood) {
    case 'celebrating':
      return { backgroundColor: '#00C853' };
    case 'warning':
      return { backgroundColor: '#FF5252' };
    case 'sad':
      return { backgroundColor: '#7F9FCC' };
    default:
      return { backgroundColor: '#FFFFFF' };
  }
}

function getMouthExpression(mood: MascotMood): { borderRadius: number; width: number; height: number; backgroundColor: string } {
  switch (mood) {
    case 'happy':
    case 'celebrating':
      return { borderRadius: 999, width: 20, height: 10, backgroundColor: '#FF6B9D' };
    case 'thinking':
      return { borderRadius: 999, width: 8, height: 8, backgroundColor: '#FFD93D' };
    case 'warning':
    case 'sad':
      return { borderRadius: 4, width: 16, height: 4, backgroundColor: '#FF5252' };
    default:
      return { borderRadius: 999, width: 20, height: 10, backgroundColor: '#FF6B9D' };
  }
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  mascot: { position: 'relative', alignItems: 'center' },
  crown: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  body: {
    position: 'absolute',
    top: '20%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  eye: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  eyeExpression: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A1A1A',
  },
  mouth: {
    position: 'absolute',
  },
  emblem: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD93D',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
