import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CARTOON_COLORS } from '../../theme/cartoonTheme';
import type { MascotMood } from './Mascot';

interface MascotSpeechBubbleProps {
  message: string;
  mood?: MascotMood;
  onDismiss?: () => void;
  style?: any;
}

/** Accent bar color per mood, matching the Mascot palette. */
const MOOD_ACCENT: Record<MascotMood, string> = {
  happy: CARTOON_COLORS.electricBlue,
  thinking: CARTOON_COLORS.electricPurple,
  celebrating: CARTOON_COLORS.moneyGreen,
  warning: CARTOON_COLORS.error,
  sad: '#7F9FCC',
};

/**
 * MascotSpeechBubble — A cartoon speech bubble shown above the Prince Haul mascot.
 * Used by payment flows to deliver friendly status messages.
 * Tap the bubble (or the ✕) to dismiss it.
 */
export default function MascotSpeechBubble({
  message,
  mood = 'happy',
  onDismiss,
  style,
}: MascotSpeechBubbleProps) {
  if (!message) return null;

  return (
    <Pressable
      onPress={onDismiss}
      disabled={!onDismiss}
      accessibilityRole="button"
      accessibilityLabel="Dismiss message"
      style={[styles.bubble, style]}
    >
      <View style={[styles.accent, { backgroundColor: MOOD_ACCENT[mood] }]} />
      <Text style={styles.text}>{message}</Text>
      {onDismiss ? <Text style={styles.close}>✕</Text> : null}
      <View style={styles.tail} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: CARTOON_COLORS.shadowPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  accent: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: 3,
    marginRight: 10,
  },
  text: {
    flex: 1,
    color: CARTOON_COLORS.charcoal,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  close: {
    color: CARTOON_COLORS.slate,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 8,
  },
  tail: {
    position: 'absolute',
    bottom: -8,
    left: 28,
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
