import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { CARTOON_COLORS } from '../../theme/cartoonTheme';

interface StaggeredListProps {
  // Accepts one or many children; React.Children.map normalizes both cases.
  children: React.ReactNode;
  staggerDelay?: number;
  itemDuration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  style?: any;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * StaggeredList — Wraps children and animates them in with staggered timing.
 * Each item slides and fades in sequentially for a delightful entrance effect.
 */
export default function StaggeredList({
  children,
  staggerDelay = 80,
  itemDuration = 400,
  direction = 'up',
  style,
}: StaggeredListProps) {
  const getInitialTransform = () => {
    switch (direction) {
      case 'down':
        return { translateY: -40, translateX: 0 };
      case 'left':
        return { translateY: 0, translateX: 40 };
      case 'right':
        return { translateY: 0, translateX: -40 };
      default:
        return { translateY: 40, translateX: 0 };
    }
  };

  const initial = getInitialTransform();

  return (
    <View style={[styles.container, style]}>
      {React.Children.map(children, (child, index) => (
        <StaggeredItem
          key={index}
          index={index}
          staggerDelay={staggerDelay}
          itemDuration={itemDuration}
          initialTranslateY={initial.translateY}
          initialTranslateX={initial.translateX}
        >
          {child}
        </StaggeredItem>
      ))}
    </View>
  );
}

interface StaggeredItemProps {
  children: React.ReactNode;
  index: number;
  staggerDelay: number;
  itemDuration: number;
  initialTranslateY: number;
  initialTranslateX: number;
}

function StaggeredItem({
  children,
  index,
  staggerDelay,
  itemDuration,
  initialTranslateY,
  initialTranslateX,
}: StaggeredItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(initialTranslateY);
  const translateX = useSharedValue(initialTranslateX);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    const delay = index * staggerDelay;
    opacity.value = withDelay(delay, withTiming(1, { duration: itemDuration, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: itemDuration, easing: Easing.out(Easing.back(1.5)) }));
    translateX.value = withDelay(delay, withTiming(0, { duration: itemDuration, easing: Easing.out(Easing.back(1.5)) }));
    scale.value = withDelay(delay, withTiming(1, { duration: itemDuration, easing: Easing.out(Easing.back(1.2)) }));
  }, [opacity, translateY, translateX, scale, index, staggerDelay, itemDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.item, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  item: {
    width: '100%',
  },
});
