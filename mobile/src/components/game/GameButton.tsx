import React, { useRef } from 'react';
import { Animated, GestureResponderEvent, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYCOON_COLORS } from '../../assets/brandColors';

export type GameButtonVariant = 'blue' | 'green' | 'gold';

const VARIANTS: Record<GameButtonVariant, { face: string; shadow: string; text: string }> = {
  blue: { face: TYCOON_COLORS.blueButton, shadow: TYCOON_COLORS.blueButtonShadow, text: '#FFFFFF' },
  green: { face: TYCOON_COLORS.moneyGreen, shadow: TYCOON_COLORS.moneyGreenShadow, text: '#FFFFFF' },
  gold: { face: TYCOON_COLORS.gold, shadow: TYCOON_COLORS.goldShadow, text: '#3A2900' },
};

interface GameButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: GameButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

/** Chunky, tactile pill button with a darker "pressed" edge — the 3D tycoon-game look. */
export default function GameButton({ label, onPress, variant = 'blue', icon, subtitle, disabled, style, fullWidth }: GameButtonProps) {
  const colors = VARIANTS[variant];
  const pressAnim = useRef(new Animated.Value(0)).current;

  const animateTo = (value: number) => {
    Animated.timing(pressAnim, { toValue: value, duration: 90, useNativeDriver: true }).start();
  };

  const translateY = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });
  const edgeHeight = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [5, 0] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      disabled={disabled}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <View style={[styles.shadowLayer, { backgroundColor: colors.shadow, opacity: disabled ? 0.4 : 1 }]}>
        <Animated.View
          style={[
            styles.faceLayer,
            { backgroundColor: colors.face, transform: [{ translateY }], marginBottom: edgeHeight as unknown as number, opacity: disabled ? 0.6 : 1 },
          ]}
        >
          {icon && <Ionicons name={icon} size={20} color={colors.text} style={styles.icon} />}
          <View>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: colors.text }]}>{subtitle}</Text> : null}
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  shadowLayer: { borderRadius: 999, padding: 0, overflow: 'hidden' },
  faceLayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.35)',
  },
  icon: { marginRight: -2 },
  label: { fontSize: 17, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 11, fontWeight: '600', opacity: 0.85, textAlign: 'center', marginTop: 1 },
});
