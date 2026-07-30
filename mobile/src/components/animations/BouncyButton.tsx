import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS, CARTOON_TYPOGRAPHY } from '../../theme/cartoonTheme';

interface BouncyButtonProps {
  /** Text label. Optional when custom `children` are provided instead. */
  label?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: React.ReactNode;
  /** Custom content rendered inside the button instead of the plain label. */
  children?: React.ReactNode;
  /** Override the variant background color (e.g. brand payment colors). */
  backgroundColor?: string;
  /** Override the variant text color. */
  textColor?: string;
  /** Draw an outline in this color (used for secondary/ghost actions). */
  borderColor?: string;
  style?: any;
}

/**
 * BouncyButton — A spring physics button with cartoon-style bounce.
 * Press down to compress, release to spring back with overshoot.
 */
export default function BouncyButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon,
  children,
  backgroundColor,
  textColor,
  borderColor,
  style,
}: BouncyButtonProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const getVariantColors = () => {
    switch (variant) {
      case 'secondary':
        return { bg: CARTOON_COLORS.bubblegumPink, text: '#FFFFFF', shadow: CARTOON_COLORS.shadowPink };
      case 'success':
        return { bg: CARTOON_COLORS.limeGreen, text: '#FFFFFF', shadow: CARTOON_COLORS.shadowGreen };
      case 'warning':
        return { bg: CARTOON_COLORS.sunshineYellow, text: '#1A1A1A', shadow: CARTOON_COLORS.shadowOrange };
      case 'danger':
        return { bg: '#FF5252', text: '#FFFFFF', shadow: 'rgba(255,82,82,0.35)' };
      default:
        return { bg: CARTOON_COLORS.electricBlue, text: '#FFFFFF', shadow: CARTOON_COLORS.shadowBlue };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 };
      case 'lg':
        return { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();

  const handlePressIn = () => {
    scale.value = withTiming(0.92, { duration: 100, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(2, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 8, stiffness: 300 });
    translateY.value = withSpring(0, { damping: 8, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={[styles.pressable, style]}
    >
      <Animated.View
        style={[
          styles.button,
          animatedStyle,
          {
            backgroundColor: disabled ? '#7F8FB3' : backgroundColor ?? colors.bg,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            shadowColor: disabled ? 'transparent' : colors.shadow,
          },
          borderColor ? { borderColor, borderWidth: 2 } : null,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        {children ?? (
          <Text style={[styles.label, { color: textColor ?? colors.text, fontSize: sizeStyles.fontSize }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CARTOON_RADIUS.pill,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
    gap: 8,
  },
  iconContainer: {
    marginRight: 4,
  },
  label: {
    fontWeight: CARTOON_TYPOGRAPHY.button.fontWeight,
    letterSpacing: 0.5,
  },
});
