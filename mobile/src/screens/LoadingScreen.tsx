import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/RootNavigator';
import PrinceHaulMascot from '../components/mascot/PrinceHaulMascot';
import FloatingShapes from '../components/animations/FloatingShapes';
import { CARTOON_COLORS, CARTOON_RADIUS } from '../theme/cartoonTheme';

const LOAD_DURATION_MS = 2500;
const TRUCK_SIZE = 30;
// The content column pads 40px on each side, so the bar spans window - 80.
const TRACK_WIDTH = Math.max(120, Dimensions.get('window').width - 80);

type LoadingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Loading'>;

export default function LoadingScreen() {
  const navigation = useNavigation<LoadingNavigationProp>();
  const progress = useRef(new Animated.Value(0)).current;
  const truckDrive = useRef(new Animated.Value(0)).current;
  const truckBounce = useRef(new Animated.Value(0)).current;
  const [mascotMood, setMascotMood] = useState<'happy' | 'excited' | 'celebrating'>('excited');
  const [loadingText, setLoadingText] = useState('Waking up Prince Haul...');

  const loadingMessages = [
    'Waking up Prince Haul... 👑',
    'Firing up the AI workers... 🤖',
    'Checking diesel prices... ⛽',
    'Scanning load boards... 🚛',
    'Optimizing routes... 🛣️',
    'Ready to roll! 🎉',
  ];

  useEffect(() => {
    // Cycle through loading messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingText(loadingMessages[messageIndex]);
    }, 400);

    Animated.timing(progress, { toValue: 1, duration: LOAD_DURATION_MS, useNativeDriver: false }).start(() => {
      clearInterval(messageInterval);
      setMascotMood('celebrating');
      setTimeout(() => {
        navigation.replace('Welcome');
      }, 500);
    });

    // 🚛 drives across the progress bar in lockstep with it (native driver)…
    Animated.timing(truckDrive, { toValue: 1, duration: LOAD_DURATION_MS, useNativeDriver: true }).start();
    // …with a bouncy suspension loop on top.
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(truckBounce, { toValue: -7, duration: 220, useNativeDriver: true }),
        Animated.timing(truckBounce, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]),
    );
    bounceLoop.start();

    return () => {
      clearInterval(messageInterval);
      bounceLoop.stop();
    };
  }, [navigation, progress, truckDrive, truckBounce]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const mascotBounce = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -15, 0] });
  const truckX = truckDrive.interpolate({ inputRange: [0, 1], outputRange: [0, TRACK_WIDTH - TRUCK_SIZE] });

  return (
    <LinearGradient
      colors={CARTOON_COLORS.gradientOcean}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <FloatingShapes shapeCount={8} />
      <View style={styles.content}>
        {/* Animated Mascot */}
        <Animated.View style={{ transform: [{ translateY: mascotBounce }] }}>
          <PrinceHaulMascot
            mood={mascotMood}
            size={100}
            showSpeechBubble={true}
            speechText={loadingText}
          />
        </Animated.View>

        {/* App Name */}
        <Text style={styles.appName}>Prince Haul Inc.</Text>
        <Text style={styles.tagline}>Your Royal AI Dispatcher 👑</Text>

        {/* Progress Bar with bouncing truck driving across it */}
        <View style={styles.trackWrap}>
          <Animated.View
            style={[styles.truck, { transform: [{ translateX: truckX }, { translateY: truckBounce }] }]}
          >
            <Text style={styles.truckEmoji}>🚛</Text>
          </Animated.View>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, { width: barWidth }]} />
          </View>
        </View>

        {/* Loading Text */}
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', gap: 20, paddingHorizontal: 40 },
  appName: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: -12 },
  trackWrap: { width: TRACK_WIDTH, marginTop: 8 },
  truck: { position: 'absolute', top: -TRUCK_SIZE - 6, left: 0, zIndex: 2 },
  truckEmoji: { fontSize: TRUCK_SIZE },
  track: {
    width: '100%',
    height: 16,
    borderRadius: CARTOON_RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: CARTOON_RADIUS.pill,
    backgroundColor: CARTOON_COLORS.sunshineYellow,
    shadowColor: CARTOON_COLORS.sunshineYellow,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  loadingText: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 14, letterSpacing: 0.5, marginTop: 8 },
});
