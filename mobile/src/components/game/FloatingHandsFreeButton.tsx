import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../../assets/brandColors';
import useHandsFreeStore from '../../store/handsFreeStore';

/** One-tap Hands-Free Mode toggle, floating on every tab so a driving driver never has to dig into Settings. */
export default function FloatingHandsFreeButton() {
  const { enabled, setEnabled } = useHandsFreeStore();

  return (
    <TouchableOpacity
      style={[styles.fab, enabled && styles.fabActive]}
      onPress={() => setEnabled(!enabled)}
      accessibilityRole="button"
      accessibilityLabel={enabled ? 'Turn off hands-free mode' : 'Turn on hands-free mode'}
    >
      <Ionicons name={enabled ? 'volume-high' : 'volume-mute'} size={26} color={enabled ? PHI_COLORS.charcoalBlack : PHI_COLORS.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 18,
    bottom: 92,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PHI_COLORS.royalBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: PHI_COLORS.sunshineYellow + '66',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabActive: {
    backgroundColor: PHI_COLORS.sunshineYellow,
    borderColor: PHI_COLORS.sunshineYellow,
  },
});
