import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TYCOON_COLORS } from '../../assets/brandColors';

export type GradientVariant = 'sky' | 'royal' | 'night';

const GRADIENTS: Record<GradientVariant, [string, string, ...string[]]> = {
  sky: [TYCOON_COLORS.skyDaylight, TYCOON_COLORS.skyBottom, TYCOON_COLORS.skyTop],
  royal: [TYCOON_COLORS.skyTop, TYCOON_COLORS.skyBottom],
  night: [TYCOON_COLORS.nightTop, TYCOON_COLORS.nightMid, TYCOON_COLORS.nightBottom],
};

interface GradientBackgroundProps {
  variant?: GradientVariant;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}

/** Full-bleed gradient backdrop with an optional soft aurora glow behind content. */
export default function GradientBackground({ variant = 'royal', children, style, glow = true }: GradientBackgroundProps) {
  const glowColor = variant === 'night' ? TYCOON_COLORS.neonCyan : TYCOON_COLORS.gold;

  return (
    <LinearGradient colors={GRADIENTS[variant]} style={[styles.fill, style]}>
      {glow && (
        <>
          <View style={[styles.glowBlob, { backgroundColor: glowColor, top: '-12%', left: '-20%' }]} />
          <View style={[styles.glowBlob, { backgroundColor: variant === 'night' ? TYCOON_COLORS.neonPink : TYCOON_COLORS.skyDaylight, bottom: '-15%', right: '-25%' }]} />
        </>
      )}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  glowBlob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.12,
  },
});
