import React, { useEffect, useRef } from 'react';
import { Animated, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TYCOON_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';

const LOAD_DURATION_MS = 2200;

type LoadingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Loading'>;

export default function LoadingScreen() {
  const navigation = useNavigation<LoadingNavigationProp>();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration: LOAD_DURATION_MS, useNativeDriver: false }).start(() => {
      navigation.replace('Welcome');
    });
  }, [navigation, progress]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <ImageBackground
      source={require('../../assets/branding/login-hero-alt.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.loadingArea}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%', justifyContent: 'flex-end' },
  loadingArea: { paddingHorizontal: 48, paddingBottom: 64, alignItems: 'center', gap: 10 },
  track: {
    width: '100%',
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: TYCOON_COLORS.gold,
    shadowColor: TYCOON_COLORS.gold,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  loadingText: { color: TYCOON_COLORS.gold, fontWeight: '800', fontSize: 13, letterSpacing: 1 },
});
