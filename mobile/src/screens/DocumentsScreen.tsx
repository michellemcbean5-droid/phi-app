import React, { useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';

interface GloveboxDoc {
  id: string;
  name: string;
  type: 'BOL' | 'POD' | 'Insurance' | 'Registration' | 'IFTA' | 'Permit' | 'Rate Con';
  status: 'Current' | 'Pending Review' | 'Archived' | 'Expiring Soon';
  date: string;
}

const DOCS: GloveboxDoc[] = [
  { id: '1', name: 'BOL — Load #DAT-8821', type: 'BOL', status: 'Current', date: 'Jun 29' },
  { id: '2', name: 'Rate Confirmation — Coyote', type: 'Rate Con', status: 'Current', date: 'Jun 29' },
  { id: '3', name: 'Insurance Certificate', type: 'Insurance', status: 'Expiring Soon', date: 'Jul 15' },
  { id: '4', name: 'IFTA Fuel Report — Q2', type: 'IFTA', status: 'Archived', date: 'Jun 1' },
  { id: '5', name: 'DOT Medical Certificate', type: 'Permit', status: 'Current', date: 'Jan 2027' },
];

const STATUS_COLORS: Record<GloveboxDoc['status'], string> = {
  'Current': PHI_COLORS.moneyGreen,
  'Pending Review': PHI_COLORS.sunshineYellow,
  'Archived': '#7F8FB3',
  'Expiring Soon': '#FF5252',
};

const TYPE_ICONS: Record<GloveboxDoc['type'], keyof typeof Ionicons.glyphMap> = {
  'BOL': 'document-text-outline',
  'POD': 'checkmark-circle-outline',
  'Insurance': 'shield-outline',
  'Registration': 'car-outline',
  'IFTA': 'receipt-outline',
  'Permit': 'ribbon-outline',
  'Rate Con': 'cash-outline',
};

export default function DocumentsScreen() {
  const [processingPOD, setProcessingPOD] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);

  const handleOneTapPayday = (): void => {
    Alert.alert(
      'One-Tap Payday',
      'Snap a photo of the signed Bill of Lading. The Finance & Invoice Specialist will read it, generate your invoice, and submit to your factoring company for payment within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Camera',
          onPress: () => {
            setProcessingPOD(true);
            setTimeout(() => {
              setProcessingPOD(false);
              setInvoiceSent(true);
              Alert.alert(
                '💰 Invoice Submitted!',
                'Your BOL was read, invoice generated for $2,840.00, and submitted to your factoring company. Expect payment within 24 hours.',
                [{ text: 'View Invoice' }],
              );
            }, 2500);
          },
        },
      ],
    );
  };

  const handleUpload = (type: string): void => {
    Alert.alert(
      `Upload ${type}`,
      'Opens your camera or file picker. The Driver Liaison logs it to your Virtual Glovebox and alerts you before anything expires.',
      [{ text: 'OK' }],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Ionicons name="folder-open-outline" size={28} color={PHI_COLORS.sunshineYellow} />
          <Text style={styles.heroTitle}>Virtual Glovebox</Text>
          <Text style={styles.heroText}>
            Every document your truck needs — instantly available during any weigh station inspection.
            The Compliance Officer keeps everything current and flags expiring docs automatically.
          </Text>
        </View>

        {/* One-Tap Payday */}
        <TouchableOpacity
          style={[styles.paydayCard, invoiceSent && styles.paydayCardSent]}
          onPress={handleOneTapPayday}
          disabled={processingPOD}
        >
          {processingPOD ? (
            <>
              <ActivityIndicator color={PHI_COLORS.charcoalBlack} size="large" />
              <Text style={styles.paydayTitle}>Reading your BOL...</Text>
              <Text style={styles.paydaySub}>Invoice Specialist is generating your invoice</Text>
            </>
          ) : invoiceSent ? (
            <>
              <Ionicons name="checkmark-circle" size={36} color={PHI_COLORS.charcoalBlack} />
              <Text style={styles.paydayTitle}>Invoice Sent — Payday in 24hrs</Text>
              <Text style={styles.paydaySub}>Submitted to factoring company</Text>
            </>
          ) : (
            <>
              <Ionicons name="camera-outline" size={36} color={PHI_COLORS.charcoalBlack} />
              <Text style={styles.paydayTitle}>One-Tap Payday</Text>
              <Text style={styles.paydaySub}>
                Snap the signed BOL → AI reads it → invoice generated → submitted to factoring in seconds
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Quick Upload Buttons */}
        <View style={styles.uploadGrid}>
          {(['Bill of Lading', 'Rate Confirmation', 'Insurance Doc', 'IFTA Report'] as const).map((type) => (
            <TouchableOpacity key={type} style={styles.uploadChip} onPress={() => handleUpload(type)}>
              <Ionicons name="cloud-upload-outline" size={16} color={PHI_COLORS.sunshineYellow} />
              <Text style={styles.uploadChipText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Glovebox Documents */}
        <View style={styles.docsCard}>
          <Text style={styles.docsTitle}>Your Glovebox</Text>
          {DOCS.map((doc) => (
            <TouchableOpacity key={doc.id} style={styles.docRow}>
              <View style={styles.docIconWrap}>
                <Ionicons name={TYPE_ICONS[doc.type]} size={20} color={PHI_COLORS.sunshineYellow} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docDate}>{doc.type} · {doc.date}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[doc.status] + '33' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[doc.status] }]}>{doc.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weigh Station Alert Card */}
        <View style={styles.alertCard}>
          <Ionicons name="warning-outline" size={20} color={PHI_COLORS.sunshineYellow} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Weigh Station Ahead</Text>
            <Text style={styles.alertText}>
              I-20 Westbound · 14 miles · Your Glovebox is inspection-ready. All documents current.
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 14 },
  heroCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 20, padding: 20, alignItems: 'center', gap: 10 },
  heroTitle: { color: PHI_COLORS.white, fontSize: 22, fontWeight: '900' },
  heroText: { color: '#D7E3FF', lineHeight: 20, textAlign: 'center' },
  paydayCard: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 20, padding: 24, alignItems: 'center', gap: 10 },
  paydayCardSent: { backgroundColor: PHI_COLORS.moneyGreen },
  paydayTitle: { color: PHI_COLORS.charcoalBlack, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  paydaySub: { color: '#2A2A00', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  uploadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  uploadChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PHI_COLORS.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#29508C' },
  uploadChipText: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 13 },
  docsCard: { backgroundColor: PHI_COLORS.card, borderRadius: 18, padding: 18, gap: 4 },
  docsTitle: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 16, marginBottom: 10 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E3A62' },
  docIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#132B52', alignItems: 'center', justifyContent: 'center' },
  docName: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 14 },
  docDate: { color: '#7F9FCC', fontSize: 12, marginTop: 2 },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontWeight: '800', fontSize: 11 },
  alertCard: { backgroundColor: '#1A0A00', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: PHI_COLORS.sunshineYellow + '44', alignItems: 'flex-start' },
  alertTitle: { color: PHI_COLORS.sunshineYellow, fontWeight: '800', fontSize: 14 },
  alertText: { color: '#D7C0A0', fontSize: 13, lineHeight: 18, marginTop: 3 },
});
