import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/RootNavigator';
import PrinceHaulMascot from '../components/mascot/PrinceHaulMascot';
import FloatingShapes from '../components/animations/FloatingShapes';
import { CARTOON_COLORS, CARTOON_RADIUS } from '../theme/cartoonTheme';

const LOAD_DURATION_MS = 2500;

type LoadingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Loading'>;

export default function LoadingScreen() {
  const navigation = useNavigation<LoadingNavigationProp>();
  const progress = useRef(new Animated.Value(0)).current;
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

    return () => clearInterval(messageInterval);
  }, [navigation, progress]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const mascotBounce = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -15, 0] });

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

        {/* Progress Bar */}
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
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
  track: {
    width: '100%',
    height: 16,
    borderRadius: CARTOON_RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginTop: 8,
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
