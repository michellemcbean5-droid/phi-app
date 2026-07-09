import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pressable, StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { CARTOON_COLORS } from '../../theme/cartoonTheme';

export type MascotMood = 'happy' | 'thinking' | 'celebrating' | 'warning' | 'sad' | 'excited';

interface PrinceHaulMascotProps {
  mood?: MascotMood;
  size?: number;
  onPress?: () => void;
  showSpeechBubble?: boolean;
  speechText?: string;
  autoCelebrate?: boolean;
  style?: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 👑 Prince Haul — The Royal Truck Driver Mascot for phi-app
 * 
 * A cartoon royal truck driver mascot combining 👑 + 🚛 creatively:
 * - SVG-style art using React Native Views for body, crown, truck elements
 * - Animated with react-native-reanimated: bounce on entry, wiggle on tap, celebrate on success
 * - Speech bubble that shows helpful tips
 */
export default function PrinceHaulMascot({
  mood = 'happy',
  size = 100,
  onPress,
  showSpeechBubble = false,
  speechText = '',
  autoCelebrate = false,
  style,
}: PrinceHaulMascotProps) {
  const bounceY = useSharedValue(size);
  const scale = useSharedValue(0);
  const wiggleRotation = useSharedValue(0);
  const celebrateScale = useSharedValue(1);
  const floatY = useSharedValue(0);
  const blinkOpacity = useSharedValue(1);
  const [displaySpeech, setDisplaySpeech] = useState(speechText);
  const [isVisible, setIsVisible] = useState(true);

  // Entry bounce animation
  useEffect(() => {
    bounceY.value = withSpring(0, { damping: 12, stiffness: 100 });
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
  }, [bounceY, scale]);

  // Floating idle animation
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [floatY]);

  // Blink animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      blinkOpacity.value = withSequence(
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }, 3000);
    return () => clearInterval(blinkInterval);
  }, [blinkOpacity]);

  // Auto celebrate
  useEffect(() => {
    if (autoCelebrate) {
      celebrateScale.value = withSequence(
        withTiming(1.3, { duration: 200 }),
        withTiming(1, { duration: 200 }),
        withTiming(1.2, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [autoCelebrate, celebrateScale]);

  // Update speech text
  useEffect(() => {
    setDisplaySpeech(speechText);
  }, [speechText]);

  const handlePress = useCallback(() => {
    // Wiggle animation
    wiggleRotation.value = withSequence(
      withTiming(-15, { duration: 100 }),
      withTiming(15, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
    onPress?.();
  }, [wiggleRotation, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounceY.value + floatY.value },
      { scale: scale.value * celebrateScale.value },
      { rotate: `${wiggleRotation.value}deg` },
    ],
  }));

  const eyeStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }));

  const getMoodColors = () => {
    switch (mood) {
      case 'celebrating':
        return { crown: '#FFD700', body: '#FF6B9D', cheeks: '#FF8C42' };
      case 'excited':
        return { crown: '#FFD93D', body: '#4A90FF', cheeks: '#FF6B9D' };
      case 'warning':
        return { crown: '#FF5252', body: '#FF8C42', cheeks: '#FFD93D' };
      case 'sad':
        return { crown: '#7F9FCC', body: '#5C7AEA', cheeks: '#9B59B6' };
      case 'thinking':
        return { crown: '#9B59B6', body: '#6BCF7F', cheeks: '#FFD93D' };
      default:
        return { crown: '#FFD93D', body: '#4A90FF', cheeks: '#FF6B9D' };
    }
  };

  const getEyeShape = () => {
    switch (mood) {
      case 'celebrating':
      case 'excited':
        return { width: size * 0.12, height: size * 0.14, borderRadius: size * 0.06 };
      case 'thinking':
        return { width: size * 0.1, height: size * 0.06, borderRadius: size * 0.03 };
      case 'warning':
        return { width: size * 0.14, height: size * 0.1, borderRadius: size * 0.07 };
      default:
        return { width: size * 0.12, height: size * 0.12, borderRadius: size * 0.06 };
    }
  };

  const getMouthShape = () => {
    switch (mood) {
      case 'celebrating':
      case 'excited':
        return { width: size * 0.22, height: size * 0.12, borderRadius: size * 0.11 };
      case 'thinking':
        return { width: size * 0.08, height: size * 0.08, borderRadius: size * 0.04 };
      case 'warning':
      case 'sad':
        return { width: size * 0.18, height: size * 0.04, borderRadius: size * 0.02 };
      default:
        return { width: size * 0.2, height: size * 0.1, borderRadius: size * 0.1 };
    }
  };

  const colors = getMoodColors();
  const eyeShape = getEyeShape();
  const mouthShape = getMouthShape();
  const truckScale = size * 0.008;

  if (!isVisible) return null;

  return (
    <View style={[styles.container, { width: size * 1.5, height: size * 1.8 }, style]}>
      {/* Speech Bubble */}
      {showSpeechBubble && displaySpeech && (
        <View style={[styles.speechBubble, { top: -size * 0.3, left: size * 0.2 }]}>
          <Text style={styles.speechText}>{displaySpeech}</Text>
          <View style={styles.speechTail} />
        </View>
      )}

      <Pressable onPress={handlePress} style={styles.pressArea}>
        <Animated.View style={[styles.mascotWrapper, animatedStyle]}>
          {/* Crown */}
          <View style={[styles.crownContainer, { top: -size * 0.08, left: size * 0.15 }]}>
            <View style={[styles.crownBase, { backgroundColor: colors.crown, width: size * 0.6, height: size * 0.15 }]} />
            <View style={[styles.crownPoint1, { borderBottomColor: colors.crown, left: 0 }]} />
            <View style={[styles.crownPoint2, { borderBottomColor: colors.crown, left: size * 0.15 }]} />
            <View style={[styles.crownPoint3, { borderBottomColor: colors.crown, left: size * 0.3 }]} />
            <View style={[styles.crownJewel, { left: size * 0.22, top: size * 0.06 }]} />
          </View>

          {/* Body (Round truck driver shape) */}
          <View
            style={[
              styles.body,
              {
                backgroundColor: colors.body,
                width: size * 0.75,
                height: size * 0.7,
                borderRadius: size * 0.375,
                top: size * 0.15,
                left: size * 0.075,
              },
            ]}
          />

          {/* Cheeks */}
          <View style={[styles.cheek, { backgroundColor: colors.cheeks, left: size * 0.12, top: size * 0.45 }]} />
          <View style={[styles.cheek, { backgroundColor: colors.cheeks, right: size * 0.12, top: size * 0.45 }]} />

          {/* Eyes */}
          <Animated.View
            style={[
              styles.eye,
              eyeStyle,
              {
                left: size * 0.25,
                top: size * 0.35,
                width: eyeShape.width,
                height: eyeShape.height,
                borderRadius: eyeShape.borderRadius,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.eye,
              eyeStyle,
              {
                right: size * 0.25,
                top: size * 0.35,
                width: eyeShape.width,
                height: eyeShape.height,
                borderRadius: eyeShape.borderRadius,
              },
            ]}
          />

          {/* Pupils */}
          <View style={[styles.pupil, { left: size * 0.29, top: size * 0.38 }]} />
          <View style={[styles.pupil, { right: size * 0.29, top: size * 0.38 }]} />

          {/* Mouth */}
          <View
            style={[
              styles.mouth,
              {
                width: mouthShape.width,
                height: mouthShape.height,
                borderRadius: mouthShape.borderRadius,
                backgroundColor: mood === 'sad' || mood === 'warning' ? '#FF5252' : '#FF6B9D',
                top: size * 0.52,
                left: size * 0.29,
              },
            ]}
          />

          {/* Truck Emblem on Chest */}
          <View style={[styles.truckEmblem, { top: size * 0.62, left: size * 0.35 }]}>
            <View style={[styles.truckBody, { transform: [{ scale: truckScale }] }]}>
              <View style={styles.truckCab} />
              <View style={styles.truckBed} />
              <View style={styles.truckWheel1} />
              <View style={styles.truckWheel2} />
            </View>
          </View>

          {/* Sparkles for celebrating mood */}
          {(mood === 'celebrating' || mood === 'excited') && (
            <>
              <View style={[styles.sparkle, { top: -size * 0.1, left: -size * 0.1 }]}>
                <Text style={{ fontSize: size * 0.15 }}>✨</Text>
              </View>
              <View style={[styles.sparkle, { top: -size * 0.05, right: -size * 0.05 }]}>
                <Text style={{ fontSize: size * 0.12 }}>⭐</Text>
              </View>
              <View style={[styles.sparkle, { bottom: size * 0.1, left: -size * 0.08 }]}>
                <Text style={{ fontSize: size * 0.1 }}>✨</Text>
              </View>
            </>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  crownBase: {
    borderRadius: 4,
  },
  crownPoint1: {
    position: 'absolute',
    top: -14,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  crownPoint2: {
    position: 'absolute',
    top: -18,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  crownPoint3: {
    position: 'absolute',
    top: -14,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  crownJewel: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B9D',
    zIndex: 11,
  },
  body: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  cheek: {
    position: 'absolute',
    width: 14,
    height: 10,
    borderRadius: 7,
    opacity: 0.5,
  },
  eye: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  pupil: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1A1A1A',
    zIndex: 5,
  },
  mouth: {
    position: 'absolute',
    zIndex: 5,
  },
  truckEmblem: {
    position: 'absolute',
    zIndex: 5,
  },
  truckBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  truckCab: {
    width: 14,
    height: 10,
    backgroundColor: '#FFD93D',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  truckBed: {
    width: 20,
    height: 8,
    backgroundColor: '#FF6B9D',
    borderRadius: 2,
    marginTop: -2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  truckWheel1: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1A1A1A',
    position: 'absolute',
    bottom: -2,
    left: 2,
  },
  truckWheel2: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1A1A1A',
    position: 'absolute',
    bottom: -2,
    right: 2,
  },
  sparkle: {
    position: 'absolute',
  },
  speechBubble: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 200,
    shadowColor: CARTOON_COLORS.shadowPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  speechText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
  speechTail: {
    position: 'absolute',
    bottom: -8,
    left: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
});
