import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../../assets/brandColors';
import { RootStackParamList } from '../../navigation/RootNavigator';
import usePromoStore from '../../store/promoStore';
import { hasFloatingAssistant } from '../../utils/subscriptionGating';

/** "Ask Michelle" floating bubble — a Solo-and-up perk, one tap away from any tab. */
export default function FloatingAssistantButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { getEffectiveTier } = usePromoStore();

  if (!hasFloatingAssistant(getEffectiveTier())) return null;

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => navigation.navigate('SupportChat')}
      accessibilityRole="button"
      accessibilityLabel="Ask Michelle, your AI assistant"
    >
      <Ionicons name="chatbubble-ellipses" size={26} color={PHI_COLORS.charcoalBlack} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 92,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PHI_COLORS.sunshineYellow,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
