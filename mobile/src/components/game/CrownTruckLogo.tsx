import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { TYCOON_COLORS } from '../../assets/brandColors';

interface CrownTruckLogoProps {
  size?: number;
  showWordmark?: boolean;
  wordmark?: string;
}

/** Crown-over-truck emblem shared by the loading screen and welcome screen. */
export default function CrownTruckLogo({ size = 56, showWordmark = true, wordmark = 'PHII' }: CrownTruckLogoProps) {
  return (
    <View style={styles.wrap}>
      <FontAwesome5 name="crown" size={size * 0.55} color={TYCOON_COLORS.gold} style={styles.crown} />
      <MaterialCommunityIcons name="truck" size={size} color="#3D7CFF" style={styles.truck} />
      {showWordmark && (
        <View style={styles.wordmarkWrap}>
          <Text style={styles.wordmark}>{wordmark}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  crown: { marginBottom: -10, textShadowColor: 'rgba(255,215,0,0.6)', textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } },
  truck: { textShadowColor: 'rgba(61,124,255,0.5)', textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } },
  wordmarkWrap: { marginTop: 6 },
  wordmark: {
    fontSize: 34,
    fontWeight: '900',
    color: TYCOON_COLORS.gold,
    letterSpacing: 2,
    textShadowColor: TYCOON_COLORS.goldShadow,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
});
