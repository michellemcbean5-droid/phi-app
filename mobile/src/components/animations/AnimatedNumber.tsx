import React, { useEffect } from 'react';
import { StyleProp, TextInput, TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  /** Target value to count up to. Re-animates whenever it changes. */
  value: number;
  /** Static prefix, e.g. "$". */
  prefix?: string;
  /** Static suffix, e.g. "%". */
  suffix?: string;
  /** Fraction digits to render (0 → "$4,250", 2 → "2.80"). */
  decimals?: number;
  /** Count-up duration in ms. */
  duration?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Worklet-safe number formatter with thousands grouping (no Intl — Hermes
 * worklets can't rely on it). Runs on both the JS and UI thread.
 */
export function formatNumberValue(n: number, decimals: number): string {
  'worklet';
  const isNegative = n < 0;
  const fixed = Math.abs(n).toFixed(decimals);
  const dotIndex = fixed.indexOf('.');
  let intPart = dotIndex >= 0 ? fixed.slice(0, dotIndex) : fixed;
  const fracPart = dotIndex >= 0 ? fixed.slice(dotIndex) : '';
  let grouped = '';
  while (intPart.length > 3) {
    grouped = ',' + intPart.slice(intPart.length - 3) + grouped;
    intPart = intPart.slice(0, intPart.length - 3);
  }
  return (isNegative ? '-' : '') + intPart + grouped + fracPart;
}

// `text` is a real native prop of TextInput (used for UI-thread-driven text
// updates) but is missing from the public RN type definitions.
type AnimatedTextInputProps = React.ComponentProps<typeof TextInput> & { text?: string };

/**
 * AnimatedNumber — counts up from 0 to `value` on mount (and on change) with a
 * Reanimated shared value driving an animated TextInput entirely on the UI
 * thread. Render text stays native-driver friendly (no JS-thread setState).
 */
export default function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 900,
  style,
}: AnimatedNumberProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [value, duration, progress]);

  const animatedProps = useAnimatedProps<AnimatedTextInputProps>(() => ({
    text: prefix + formatNumberValue(progress.value, decimals) + suffix,
  }));

  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      defaultValue={prefix + formatNumberValue(0, decimals) + suffix}
      animatedProps={animatedProps}
      style={[{ padding: 0, margin: 0, backgroundColor: 'transparent' }, style]}
    />
  );
}
