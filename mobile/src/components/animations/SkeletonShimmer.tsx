import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface SkeletonShimmerProps {
  style?: any;
}

/**
 * SkeletonShimmer — Pulsing placeholder card shown while content loads.
 * Render one per expected item (e.g. a list row) via the `style` prop.
 */
export default function SkeletonShimmer({ style }: SkeletonShimmerProps) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#1E3A62',
    borderRadius: 12,
    width: '100%',
    height: 80,
  },
});
