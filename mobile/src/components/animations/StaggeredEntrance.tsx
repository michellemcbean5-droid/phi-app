import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface StaggeredEntranceProps {
  children: React.ReactNode;
  /**
   * When provided, only the direct child is animated using this position in
   * the cascade. When omitted, every child is cascaded automatically.
   */
  index?: number;
  /** Base delay between items in ms. */
  staggerDelay?: number;
  /** Per-item animation duration in ms. */
  duration?: number;
  /** Hard cap on total entrance time (last delay + duration) in ms. */
  maxTotalMs?: number;
  /** Initial downward offset in px (slides up to rest). */
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

interface EntranceItemProps {
  children: React.ReactNode;
  delay: number;
  duration: number;
  distance: number;
  style?: StyleProp<ViewStyle>;
}

function EntranceItem({ children, delay, duration, distance, style }: EntranceItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withTiming(0, { duration, easing: Easing.out(Easing.cubic) }));
  }, [delay, duration, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

/**
 * StaggeredEntrance — reusable cascading fade + slide-up entrance wrapper.
 * Opacity/translateY only (native driver). The stagger is capped via
 * `maxTotalMs` so the full cascade always finishes in under 1.2s, no matter
 * how many children are wrapped.
 */
export default function StaggeredEntrance({
  children,
  index,
  staggerDelay = 70,
  duration = 420,
  maxTotalMs = 1150,
  distance = 24,
  style,
}: StaggeredEntranceProps) {
  const maxDelay = Math.max(0, maxTotalMs - duration);
  const delayFor = (i: number) => Math.min(i * staggerDelay, maxDelay);

  if (index !== undefined) {
    return (
      <EntranceItem delay={delayFor(index)} duration={duration} distance={distance} style={style}>
        {children}
      </EntranceItem>
    );
  }

  return (
    <>
      {React.Children.map(children, (child, i) => (
        <EntranceItem key={i} delay={delayFor(i)} duration={duration} distance={distance} style={style}>
          {child}
        </EntranceItem>
      ))}
    </>
  );
}
