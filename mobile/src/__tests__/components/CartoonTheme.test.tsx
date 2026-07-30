import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import PrinceHaulMascot from '../../components/mascot/PrinceHaulMascot';
import BouncyButton from '../../components/animations/BouncyButton';
import StaggeredList from '../../components/animations/StaggeredList';
import ConfettiCelebration from '../../components/animations/ConfettiCelebration';
import FloatingShapes from '../../components/animations/FloatingShapes';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS, CARTOON_TYPOGRAPHY } from '../../theme/cartoonTheme';

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  useSharedValue: (val: number) => ({ value: val }),
  useAnimatedStyle: () => ({}),
  withSpring: () => 0,
  withTiming: () => 0,
  withSequence: () => 0,
  withRepeat: () => 0,
  withDelay: () => 0,
  Easing: {
    out: () => () => 0,
    inOut: () => () => 0,
    back: () => () => 0,
    sin: () => 0,
    quad: () => 0,
    linear: () => 0,
  },
  runOnJS: (fn: Function) => fn,
  interpolate: () => 0,
}));

vi.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
  default: {},
}));

describe('PrinceHaulMascot', () => {
  it('renders with default props', () => {
    const { getByText } = render(
      <PrinceHaulMascot mood="happy" size={80} showSpeechBubble={true} speechText="Hello!" />
    );
    expect(getByText('Hello!')).toBeTruthy();
  });

  it('renders all mood variants', () => {
    const moods = ['happy', 'thinking', 'celebrating', 'warning', 'sad', 'excited'] as const;
    moods.forEach((mood) => {
      const { UNSAFE_getByType } = render(
        <PrinceHaulMascot mood={mood} size={80} />
      );
      expect(UNSAFE_getByType(PrinceHaulMascot)).toBeTruthy();
    });
  });

  it('renders without speech bubble when disabled', () => {
    const { queryByText } = render(
      <PrinceHaulMascot mood="happy" size={80} showSpeechBubble={false} speechText="Hidden" />
    );
    expect(queryByText('Hidden')).toBeNull();
  });

  it('handles onPress callback', () => {
    const onPress = vi.fn();
    const { getByText } = render(
      <PrinceHaulMascot mood="happy" size={80} showSpeechBubble={true} speechText="Tap me!" onPress={onPress} />
    );
    expect(getByText('Tap me!')).toBeTruthy();
  });
});

describe('BouncyButton', () => {
  it('renders with primary variant', () => {
    const { getByText } = render(
      <BouncyButton label="Test Button" onPress={() => {}} variant="primary" />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('renders all variants', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'danger'] as const;
    variants.forEach((variant) => {
      const { getByText } = render(
        <BouncyButton label={`${variant} Button`} onPress={() => {}} variant={variant} />
      );
      expect(getByText(`${variant} Button`)).toBeTruthy();
    });
  });

  it('renders all sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    sizes.forEach((size) => {
      const { getByText } = render(
        <BouncyButton label={`${size} Button`} onPress={() => {}} size={size} />
      );
      expect(getByText(`${size} Button`)).toBeTruthy();
    });
  });

  it('renders disabled state', () => {
    const { getByText } = render(
      <BouncyButton label="Disabled" onPress={() => {}} disabled={true} />
    );
    expect(getByText('Disabled')).toBeTruthy();
  });

  it('renders with icon', () => {
    const { getByText } = render(
      <BouncyButton label="With Icon" onPress={() => {}} icon={<Text>🔥</Text>} />
    );
    expect(getByText('With Icon')).toBeTruthy();
  });
});

describe('StaggeredList', () => {
  it('renders children with stagger animation', () => {
    const { getByText } = render(
      <StaggeredList staggerDelay={100}>
        <Text>Item 1</Text>
        <Text>Item 2</Text>
        <Text>Item 3</Text>
      </StaggeredList>
    );
    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
    expect(getByText('Item 3')).toBeTruthy();
  });

  it('renders with different directions', () => {
    const directions = ['up', 'down', 'left', 'right'] as const;
    directions.forEach((direction) => {
      const { getByText } = render(
        <StaggeredList direction={direction}>
          <Text>{direction}</Text>
        </StaggeredList>
      );
      expect(getByText(direction)).toBeTruthy();
    });
  });
});

describe('ConfettiCelebration', () => {
  it('does not render when trigger is 0', () => {
    const { toJSON } = render(
      <ConfettiCelebration trigger={0} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders confetti when triggered', () => {
    const { UNSAFE_getByType } = render(
      <ConfettiCelebration trigger={1} particleCount={30} />
    );
    expect(UNSAFE_getByType(ConfettiCelebration)).toBeTruthy();
  });
});

describe('FloatingShapes', () => {
  it('renders floating shapes', () => {
    const { UNSAFE_getByType } = render(
      <FloatingShapes shapeCount={8} />
    );
    expect(UNSAFE_getByType(FloatingShapes)).toBeTruthy();
  });
});

describe('cartoonTheme', () => {
  it('has all required colors', () => {
    expect(CARTOON_COLORS.electricBlue).toBe('#4A90FF');
    expect(CARTOON_COLORS.bubblegumPink).toBe('#FF6B9D');
    expect(CARTOON_COLORS.sunshineYellow).toBe('#FFD93D');
    expect(CARTOON_COLORS.limeGreen).toBe('#6BCF7F');
    expect(CARTOON_COLORS.electricPurple).toBe('#9B59B6');
  });

  it('has shadow presets', () => {
    expect(CARTOON_SHADOWS.sm).toBeDefined();
    expect(CARTOON_SHADOWS.md).toBeDefined();
    expect(CARTOON_SHADOWS.lg).toBeDefined();
    expect(CARTOON_SHADOWS.xl).toBeDefined();
    expect(CARTOON_SHADOWS.sm.shadowRadius).toBe(6);
  });

  it('has radius presets', () => {
    expect(CARTOON_RADIUS.sm).toBe(12);
    expect(CARTOON_RADIUS.lg).toBe(24);
    expect(CARTOON_RADIUS.pill).toBe(999);
  });

  it('has typography presets', () => {
    expect(CARTOON_TYPOGRAPHY.hero.fontSize).toBe(40);
    expect(CARTOON_TYPOGRAPHY.button.fontWeight).toBe('900');
  });
});
