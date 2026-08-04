// Slim animated status bar shown at top of screens when connection is degraded.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RealtimeStatus } from '../hooks/useRealtimeLoads';

interface Props {
  status: RealtimeStatus;
}

const STATUS_CONFIG: Record<
  RealtimeStatus,
  { label: string; bg: string; icon: keyof typeof Ionicons.glyphMap; visible: boolean }
> = {
  connected: { label: 'Live', bg: '#00C853', icon: 'radio', visible: false },
  connecting: { label: 'Connecting…', bg: '#FFD93D', icon: 'sync', visible: true },
  disconnected: { label: 'Offline — using cached data', bg: '#FF5252', icon: 'cloud-offline', visible: true },
  offline: { label: 'No network', bg: '#FF5252', icon: 'wifi', visible: true },
};

export default function ConnectionStatusBar({ status }: Props): React.JSX.Element | null {
  const config = STATUS_CONFIG[status];
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: config.visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [config.visible, opacity]);

  if (!config.visible) return null;

  return (
    <Animated.View style={[styles.bar, { backgroundColor: config.bg, opacity }]}>
      <Ionicons name={config.icon} size={12} color="#fff" />
      <Text style={styles.label}>{config.label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  label: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
