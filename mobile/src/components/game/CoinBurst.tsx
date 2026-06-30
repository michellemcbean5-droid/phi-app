import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ParticleKind } from './FloatingParticles';

interface CoinBurstProps {
  /** Increment this to fire a new burst — e.g. agentStore's `coinBurstSeq`. */
  trigger: number;
  count?: number;
  kind?: ParticleKind;
}

const ICONS: Record<ParticleKind, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  dollar: { name: 'logo-usd', color: '#3CCB6A' },
  coin: { name: 'ellipse', color: '#FFD700' },
  star: { name: 'sparkles', color: '#FFF3B0' },
};

interface Coin {
  key: string;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  kind: ParticleKind;
}

function BurstCoin({
  coin,
  originX,
  originY,
  onDone,
}: {
  coin: Coin;
  originX: number;
  originY: number;
  onDone: (key: string) => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      coin.delay,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(onDone)(coin.key);
        }
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const dx = Math.cos(coin.angle) * coin.distance * progress.value;
    const dy = Math.sin(coin.angle) * coin.distance * progress.value - progress.value * 60;
    return {
      transform: [{ translateX: dx }, { translateY: dy }, { scale: 0.6 + progress.value * 0.6 }],
      opacity: 1 - progress.value,
    };
  });

  const icon = ICONS[coin.kind];

  return (
    <Animated.View style={[styles.coin, { left: originX, top: originY }, style]}>
      <Ionicons name={icon.name} size={coin.size} color={icon.color} />
    </Animated.View>
  );
}

/** One-shot burst of gold-coin particles fired whenever `trigger` changes — e.g. when an invoice clears. */
export default function CoinBurst({ trigger, count = 14, kind = 'coin' }: CoinBurstProps) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const prevTrigger = useRef(trigger);
  const screen = Dimensions.get('window');

  useEffect(() => {
    if (trigger === prevTrigger.current) return;
    prevTrigger.current = trigger;

    const burst: Coin[] = Array.from({ length: count }).map((_, i) => ({
      key: `${trigger}-${i}`,
      angle: (Math.PI * 2 * i) / count + Math.random() * 0.3,
      distance: 80 + Math.random() * 70,
      size: 18 + Math.random() * 12,
      delay: Math.random() * 150,
      kind: i % 5 === 0 ? 'star' : kind,
    }));
    setCoins((prev) => [...prev, ...burst]);
  }, [trigger, count, kind]);

  const removeCoin = (key: string) => {
    setCoins((prev) => prev.filter((c) => c.key !== key));
  };

  if (coins.length === 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {coins.map((coin) => (
        <BurstCoin
          key={coin.key}
          coin={coin}
          originX={screen.width / 2}
          originY={screen.height / 2}
          onDone={removeCoin}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  coin: { position: 'absolute' },
});
