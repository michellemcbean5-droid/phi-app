import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../../assets/brandColors';
import { BookingConfirmation } from '../../workers/AutoBookingEngine';
import { Load } from '../../workers/workers-15x';

interface Props {
  visible: boolean;
  load: Load | null;
  confirmation: BookingConfirmation | null;
  onClose: () => void;
}

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  role: string;
  detail: string;
}

/**
 * Shown right after a load books — makes visible, step by step, that the whole
 * booking-to-invoice chain actually ran, not just a silent status flip.
 */
export default function BookingConfirmationModal({ visible, load, confirmation, onClose }: Props) {
  if (!load || !confirmation) return null;

  const steps: Step[] = [
    {
      icon: 'chatbubbles-outline',
      role: 'Freight Negotiator',
      detail: `Locked in $${load.rate.toFixed(0)} ($${load.rpm.toFixed(2)}/mi) with ${load.brokerName}`,
    },
    {
      icon: 'radio-outline',
      role: 'Dispatch Coordinator',
      detail: `Confirmed pickup at ${load.origin.city}, ${load.origin.state} for ${load.pickupDate}`,
    },
    {
      icon: 'receipt-outline',
      role: 'Invoice Specialist',
      detail: 'Invoice queued — bills automatically the moment delivery is confirmed',
    },
    {
      icon: 'location-outline',
      role: 'Track & Trace',
      detail: `Monitoring ETA to ${load.destination.city}, ${load.destination.state}`,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="checkmark-circle" size={32} color={PHI_COLORS.moneyGreen} />
            <Text style={styles.title}>Load Booked</Text>
            <Text style={styles.subtitle}>Confirmation #{confirmation.confirmationId}</Text>
          </View>

          <Text style={styles.sectionLabel}>Here's what just happened, automatically:</Text>

          {steps.map((step) => (
            <View key={step.role} style={styles.stepRow}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon} size={18} color={PHI_COLORS.charcoalBlack} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepRole}>{step.role}</Text>
                <Text style={styles.stepDetail}>{step.detail}</Text>
              </View>
              <Ionicons name="checkmark" size={18} color={PHI_COLORS.moneyGreen} />
            </View>
          ))}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  card: { backgroundColor: PHI_COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  header: { alignItems: 'center', gap: 4, marginBottom: 6 },
  title: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#A8B7D8', fontSize: 12 },
  sectionLabel: { color: '#D7E3FF', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#132B52', borderRadius: 14, padding: 12 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: PHI_COLORS.sunshineYellow, alignItems: 'center', justifyContent: 'center' },
  stepRole: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 13 },
  stepDetail: { color: '#A8B7D8', fontSize: 12, marginTop: 2 },
  closeButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  closeButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 15 },
});
