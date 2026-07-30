import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { CARTOON_COLORS } from '../../theme/cartoonTheme';

interface FloatingShapesProps {
  shapeCount?: number;
  style?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShapeConfig {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  type: 'circle' | 'square' | 'triangle';
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  opacity: number;
}

/**
 * FloatingShapes — Background floating cartoon elements.
 * Circles, squares, and triangles float gently across the screen for a playful atmosphere.
 */
export default function FloatingShapes({ shapeCount = 12, style }: FloatingShapesProps) {
  const colors = [
    CARTOON_COLORS.electricBlue,
    CARTOON_COLORS.bubblegumPink,
    CARTOON_COLORS.sunshineYellow,
    CARTOON_COLORS.limeGreen,
    CARTOON_COLORS.electricPurple,
    '#FF8C42',
    '#00FFFF',
  ];

  const shapes = useMemo<ShapeConfig[]>(() => {
    return Array.from({ length: shapeCount }, (_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT * 0.8,
      size: 20 + Math.random() * 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: (['circle', 'square', 'triangle'] as const)[Math.floor(Math.random() * 3)],
      duration: 8000 + Math.random() * 12000,
      delay: Math.random() * 3000,
      driftX: (Math.random() - 0.5) * 100,
      driftY: -50 - Math.random() * 150,
      opacity: 0.08 + Math.random() * 0.12,
    }));
  }, [shapeCount]);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {shapes.map((shape) => (
        <FloatingShape key={shape.id} shape={shape} />
      ))}
    </View>
  );
}

interface FloatingShapeProps {
  shape: ShapeConfig;
}

function FloatingShape({ shape }: FloatingShapeProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      shape.delay,
      withRepeat(
        withSequence(
          withTiming(shape.driftY, { duration: shape.duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: shape.duration / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    translateX.value = withDelay(
      shape.delay,
      withRepeat(
        withSequence(
          withTiming(shape.driftX, { duration: shape.duration / 3, easing: Easing.inOut(Easing.sin) }),
          withTiming(-shape.driftX, { duration: shape.duration / 3, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: shape.duration / 3, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    rotate.value = withDelay(
      shape.delay,
      withRepeat(
        withTiming(360, { duration: shape.duration * 1.5, easing: Easing.linear }),
        -1,
        false
      )
    );

    scale.value = withDelay(
      shape.delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: shape.duration / 4, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.85, { duration: shape.duration / 4, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: shape.duration / 4, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [translateY, translateX, rotate, scale, shape]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: shape.opacity,
  }));

  const getShapeStyle = () => {
    const base = {
      width: shape.size,
      height: shape.size,
      backgroundColor: shape.color,
    };
    switch (shape.type) {
      case 'circle':
        return { ...base, borderRadius: shape.size / 2 };
      case 'square':
        return { ...base, borderRadius: shape.size * 0.15 };
      case 'triangle':
        return {
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderStyle: 'solid' as const,
          borderLeftWidth: shape.size / 2,
          borderRightWidth: shape.size / 2,
          borderBottomWidth: shape.size,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: shape.color,
        };
      default:
        return base;
    }
  };

  return (
    <Animated.View
      style={[
        animatedStyle,
        styles.shape,
        { left: shape.x, top: shape.y },
      ]}
    >
      <View style={getShapeStyle()} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  shape: {
    position: 'absolute',
  },
});
