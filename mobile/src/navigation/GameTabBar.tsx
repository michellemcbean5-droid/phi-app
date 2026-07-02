import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { TYCOON_COLORS } from '../assets/brandColors';

type TabIconKind = 'crown' | 'truck' | 'chip' | 'dollar' | 'profile';

const TAB_META: Record<string, { kind: TabIconKind; label: string; glow: string }> = {
  Dashboard: { kind: 'crown', label: 'Leadership', glow: TYCOON_COLORS.gold },
  Loads: { kind: 'truck', label: 'Power', glow: TYCOON_COLORS.skyDaylight },
  AI: { kind: 'chip', label: 'AI', glow: TYCOON_COLORS.neonCyan },
  Earnings: { kind: 'dollar', label: 'Profit', glow: TYCOON_COLORS.moneyGreen },
  Profile: { kind: 'profile', label: 'Profile', glow: TYCOON_COLORS.gold },
};

function TabGlyph({ kind, focused, color, size }: { kind: TabIconKind; focused: boolean; color: string; size: number }) {
  switch (kind) {
    case 'crown':
      return <FontAwesome5 name="crown" size={size} color={color} solid={focused} />;
    case 'truck':
      return <MaterialCommunityIcons name={focused ? 'truck-fast' : 'truck-outline'} size={size} color={color} />;
    case 'chip':
      return <Ionicons name={focused ? 'hardware-chip' : 'hardware-chip-outline'} size={size} color={color} />;
    case 'dollar':
      return <Ionicons name="logo-usd" size={size} color={color} />;
    case 'profile':
    default:
      return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
  }
}

function GlowPulse({ glowColor }: { glowColor: string }) {
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return <Animated.View style={[styles.glow, { backgroundColor: glowColor, opacity: pulse, transform: [{ scale: pulse }] }]} />;
}

/** Gamified bottom tab bar — crown/truck/dollar-styled icons with a pulsing glow on the active tab. */
export default function GameTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: 10 + insets.bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TAB_META[route.name] ?? { kind: 'profile' as TabIconKind, label: route.name, glow: TYCOON_COLORS.gold };

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
          >
            <View style={styles.iconWrap}>
              {focused && <GlowPulse glowColor={meta.glow} />}
              <TabGlyph kind={meta.kind} focused={focused} color={focused ? meta.glow : '#7F9FCC'} size={focused ? 24 : 21} />
            </View>
            <Text style={[styles.label, focused && { color: meta.glow }]}>{meta.label}</Text>
            {focused && <View style={[styles.activeBar, { backgroundColor: meta.glow }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: TYCOON_COLORS.ribbonNavy,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,215,0,0.25)',
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 34, height: 34, borderRadius: 17 },
  label: { fontSize: 10, fontWeight: '700', color: '#7F9FCC' },
  activeBar: { position: 'absolute', bottom: -8, width: 22, height: 3, borderRadius: 2 },
});
