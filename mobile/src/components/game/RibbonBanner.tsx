import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { TYCOON_COLORS } from '../../assets/brandColors';

interface RibbonBannerProps {
  title: string;
  style?: StyleProp<ViewStyle>;
}

/** Dark-blue ribbon with gold trim and pointed end-flags, used as a section header. */
export default function RibbonBanner({ title, style }: RibbonBannerProps) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.flag, styles.flagLeft]} />
      <View style={[styles.flag, styles.flagRight]} />
      <View style={styles.body}>
        <Text style={styles.text}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  body: {
    backgroundColor: TYCOON_COLORS.ribbonNavy,
    borderWidth: 2,
    borderColor: TYCOON_COLORS.ribbonTrim,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 28,
    transform: [{ skewX: '-4deg' }],
  },
  text: {
    color: TYCOON_COLORS.gold,
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    transform: [{ skewX: '4deg' }],
    textShadowColor: TYCOON_COLORS.ribbonShadow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  flag: {
    position: 'absolute',
    top: 4,
    width: 16,
    height: 24,
    backgroundColor: TYCOON_COLORS.ribbonNavy,
    borderColor: TYCOON_COLORS.ribbonTrim,
    borderWidth: 2,
  },
  flagLeft: { left: -10, transform: [{ rotate: '45deg' }] },
  flagRight: { right: -10, transform: [{ rotate: '-45deg' }] },
});
