import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../components/game/GradientBackground';
import FloatingParticles from '../components/game/FloatingParticles';
import CrownTruckLogo from '../components/game/CrownTruckLogo';
import GameButton from '../components/game/GameButton';
import { TYCOON_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import useAuthStore from '../store/authStore';
import { createDemoToken } from '../utils/demoAuth';

type WelcomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavigationProp>();
  const login = useAuthStore((state) => state.login);

  const handleLogIn = (): void => {
    login(createDemoToken());
    navigation.replace('Main');
  };

  const handleGetStarted = (): void => {
    login(createDemoToken());
    navigation.replace('DriverPrefs');
  };

  return (
    <GradientBackground variant="sky">
      <FloatingParticles count={10} kinds={['dollar']} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.top}>
          <CrownTruckLogo size={62} showWordmark={false} />
          <Text style={styles.titleMain}>PRINCE</Text>
          <View style={styles.titleBanner}>
            <Text style={styles.titleSub}>HAUL INTELLIGENCE</Text>
          </View>
          <Text style={styles.tagline}>Make Money While You Sleep</Text>
          <Text style={styles.taglineSub}>— Powered by AI Dispatch —</Text>
        </View>

        <View style={styles.buttonRow}>
          <GameButton label="Log In" variant="blue" onPress={handleLogIn} style={styles.buttonHalf} />
          <GameButton label="Get Started" variant="green" onPress={handleGetStarted} style={styles.buttonHalf} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 24 },
  top: { alignItems: 'center', marginTop: 36, gap: 4 },
  titleMain: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: TYCOON_COLORS.ribbonShadow,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  titleBanner: {
    backgroundColor: TYCOON_COLORS.goldDeep,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: 2,
  },
  titleSub: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1.5 },
  tagline: { fontSize: 17, fontWeight: '800', color: TYCOON_COLORS.gold, marginTop: 18, textAlign: 'center' },
  taglineSub: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', marginTop: 4, opacity: 0.9 },
  buttonRow: { flexDirection: 'row', gap: 14 },
  buttonHalf: { flex: 1 },
});
