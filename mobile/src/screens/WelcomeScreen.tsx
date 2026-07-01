import React, { useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GameButton from '../components/game/GameButton';
import { RootStackParamList } from '../navigation/RootNavigator';
import useAuthStore from '../store/authStore';
import { createDemoToken } from '../utils/demoAuth';
import { PHI_COLORS } from '../assets/brandColors';

type WelcomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
type PendingAction = 'login' | 'getStarted' | null;

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNavigationProp>();
  const login = useAuthStore((state) => state.login);
  const [pending, setPending] = useState<PendingAction>(null);

  const handleLogIn = (): void => {
    if (pending) return;
    setPending('login');
    login(createDemoToken());
    navigation.replace('Main');
  };

  const handleGetStarted = (): void => {
    if (pending) return;
    setPending('getStarted');
    login(createDemoToken());
    navigation.replace('DriverPrefs');
  };

  return (
    <ImageBackground
      source={require('../../assets/branding/login-hero.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>Free app · Bring your own free AI key to unlock all 10 AI workers</Text>
        </View>
        <View style={styles.buttonRow}>
          <GameButton
            label={pending === 'login' ? 'Logging in...' : 'Log In'}
            variant="blue"
            onPress={handleLogIn}
            disabled={pending !== null}
            style={styles.buttonHalf}
          />
          <GameButton
            label={pending === 'getStarted' ? 'Starting...' : 'Get Started'}
            variant="green"
            onPress={handleGetStarted}
            disabled={pending !== null}
            style={styles.buttonHalf}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  safe: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 24 },
  freeBadge: {
    alignSelf: 'center', backgroundColor: 'rgba(1,9,35,0.75)', borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16, borderWidth: 1, borderColor: PHI_COLORS.sunshineYellow,
  },
  freeBadgeText: { color: PHI_COLORS.sunshineYellow, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 14 },
  buttonHalf: { flex: 1 },
});
