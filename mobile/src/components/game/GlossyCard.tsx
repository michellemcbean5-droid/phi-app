import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlossyCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  borderColor?: string;
}

/** Card with a subtle glossy top-light sheen, used as the container for game-style stat panels. */
export default function GlossyCard({ children, style, backgroundColor = '#0A1F3D', borderColor = '#1E3A62' }: GlossyCardProps) {
  return (
    <View style={[styles.card, { backgroundColor, borderColor }, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
        style={styles.sheen}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 20, borderWidth: 1, overflow: 'hidden' },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
});
