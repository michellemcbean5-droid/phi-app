import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/RootNavigator';
import useAuthStore from '../store/authStore';
import { createDemoToken } from '../utils/demoAuth';
import PrinceHaulMascot from '../components/mascot/PrinceHaulMascot';
import BouncyButton from '../components/animations/BouncyButton';
import FloatingShapes from '../components/animations/FloatingShapes';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS, CARTOON_TYPOGRAPHY } from '../theme/cartoonTheme';

type WelcomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
type PendingAction = 'login' | 'getStarted' | null;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavigationProp>();
  const login = useAuthStore((state) => state.login);
  const [pending, setPending] = useState<PendingAction>(null);
  const [mascotMood, setMascotMood] = useState<'happy' | 'excited' | 'celebrating'>('happy');

  const handleLogIn = (): void => {
    if (pending) return;
    setPending('login');
    setMascotMood('excited');
    login(createDemoToken());
    navigation.replace('Main');
  };

  const handleGetStarted = (): void => {
    if (pending) return;
    setPending('getStarted');
    setMascotMood('celebrating');
    login(createDemoToken());
    navigation.replace('DriverPrefs');
  };

  const handleMascotPress = () => {
    setMascotMood('excited');
    setTimeout(() => setMascotMood('happy'), 1500);
  };

  return (
    <LinearGradient
      colors={CARTOON_COLORS.gradientCandy}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.background}
    >
      <FloatingShapes shapeCount={10} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.content}>
          {/* Mascot Hero */}
          <View style={styles.mascotContainer}>
            <PrinceHaulMascot
              mood={mascotMood}
              size={120}
              onPress={handleMascotPress}
              showSpeechBubble={true}
              speechText={mascotMood === 'celebrating' ? "Let's hit the road! 🚛✨" : 'Welcome to PHI! 👑'}
              autoCelebrate={mascotMood === 'celebrating'}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Prince Haul Inc.</Text>
          <Text style={styles.subtitle}>Your Royal AI Dispatcher 👑</Text>

          {/* Tagline */}
          <View style={styles.taglineCard}>
            <Text style={styles.tagline}>
              🚛 10 AI workers · 💰 Smart bidding · 🛣️ Route optimization{'\n'}
              All running while you drive.
            </Text>
          </View>

          {/* Free Badge */}
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>🎁 Free app — Bring your own free AI key to unlock all 10 AI workers!</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <BouncyButton
            label={pending === 'login' ? 'Logging in...' : '👤 Log In'}
            onPress={handleLogIn}
            variant="primary"
            size="lg"
            disabled={pending !== null}
            style={styles.buttonHalf}
          />
          <BouncyButton
            label={pending === 'getStarted' ? 'Starting...' : '🚀 Get Started'}
            onPress={handleGetStarted}
            variant="success"
            size="lg"
            disabled={pending !== null}
            style={styles.buttonHalf}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 32, paddingTop: 40 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  mascotContainer: { marginBottom: 8 },
  title: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  taglineCard: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: CARTOON_RADIUS.lg, padding: 16, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  tagline: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 22 },
  freeBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: CARTOON_RADIUS.pill, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  freeBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
  buttonRow: { flexDirection: 'row', gap: 14, marginTop: 16 },
  buttonHalf: { flex: 1 },
});
