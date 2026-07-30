import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Mascot, { type MascotMood } from '../mascot/Mascot';
import { CARTOON_COLORS, CARTOON_TYPOGRAPHY } from '../../theme/cartoonTheme';

interface ScreenHeroProps {
  title: string;
  subtitle?: string;
  mascotMood?: MascotMood;
  mascotSize?: number;
  /** Two or more colors for the hero gradient background. */
  gradientColors?: readonly [string, string, ...string[]];
  style?: any;
}

const DEFAULT_GRADIENT: readonly [string, string, ...string[]] = ['#0057FF', '#4A90FF', '#00FFFF'];

/**
 * ScreenHero — Gradient banner header with the Prince Haul mascot,
 * title, and subtitle shown at the top of a screen.
 */
export default function ScreenHero({
  title,
  subtitle,
  mascotMood = 'happy',
  mascotSize = 72,
  gradientColors = DEFAULT_GRADIENT,
  style,
}: ScreenHeroProps) {
  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, style]}
    >
      <View style={styles.textColumn}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Mascot mood={mascotMood} size={mascotSize} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: CARTOON_COLORS.shadowBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 12,
  },
  textColumn: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: CARTOON_TYPOGRAPHY.h2.fontSize,
    fontWeight: CARTOON_TYPOGRAPHY.h2.fontWeight,
    letterSpacing: CARTOON_TYPOGRAPHY.h2.letterSpacing,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: CARTOON_TYPOGRAPHY.caption.fontSize,
    fontWeight: CARTOON_TYPOGRAPHY.caption.fontWeight,
    marginTop: 4,
  },
});
