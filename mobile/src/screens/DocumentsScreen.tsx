import React, { useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PHI_COLORS } from '../assets/brandColors';
import useDocumentsStore, { GloveboxDoc } from '../store/documentsStore';
import useWorkerStore from '../store/workerStore';

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

const UPLOAD_TYPE_MAP: Record<string, GloveboxDoc['type']> = {
  'Bill of Lading': 'BOL',
  'Rate Confirmation': 'Rate Con',
  'Insurance Doc': 'Insurance',
  'IFTA Report': 'IFTA',
};

const captureDocument = async (label: string, type: GloveboxDoc['type']): Promise<string | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Camera Permission Needed', 'Allow camera access in your phone settings to scan documents.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const store = useDocumentsStore.getState();
  const name = `${label} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  await store.addDocument(type, name, result.assets[0].uri);

  const { recordTaskCompletion } = useWorkerStore.getState();
  recordTaskCompletion('driver-liaison', 0, `Filed ${name} in your Virtual Glovebox`);
  if (type === 'POD') {
    recordTaskCompletion('invoice-specialist', 0, 'Signed POD ready for invoicing');
  }

  return result.assets[0].uri;
};

export default function DocumentsScreen() {
  const { documents, loaded, loadDocuments } = useDocumentsStore();
  const [processingPOD, setProcessingPOD] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleOneTapPayday = (): void => {
    Alert.alert(
      'One-Tap Payday',
      'Snap a photo of the signed Bill of Lading. It will be saved to your Virtual Glovebox and, once AI features are enabled, submitted for invoicing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Camera',
          onPress: () => {
            setProcessingPOD(true);
            captureDocument('Signed BOL', 'POD')
              .then((uri) => {
                setProcessingPOD(false);
                if (uri) {
                  setInvoiceSent(true);
                  Alert.alert('Saved', 'Your signed BOL was saved to your Virtual Glovebox.', [{ text: 'OK' }]);
                }
              })
              .catch(() => setProcessingPOD(false));
          },
        },
      ],
    );
  };

  const handleUpload = (label: string): void => {
    const type = UPLOAD_TYPE_MAP[label] ?? 'BOL';
    void captureDocument(label, type);
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
            Scan documents with your camera and they're saved right on your phone.
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
              <Text style={styles.paydayTitle}>Opening camera...</Text>
            </>
          ) : invoiceSent ? (
            <>
              <Ionicons name="checkmark-circle" size={36} color={PHI_COLORS.charcoalBlack} />
              <Text style={styles.paydayTitle}>BOL Saved to Glovebox</Text>
              <Text style={styles.paydaySub}>Scan another anytime</Text>
            </>
          ) : (
            <>
              <Ionicons name="camera-outline" size={36} color={PHI_COLORS.charcoalBlack} />
              <Text style={styles.paydayTitle}>One-Tap Payday</Text>
              <Text style={styles.paydaySub}>
                Snap the signed BOL → saved to your Virtual Glovebox instantly
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
          {!loaded ? (
            <Text style={styles.emptyText}>Loading your documents...</Text>
          ) : documents.length === 0 ? (
            <Text style={styles.emptyText}>No documents yet — tap a button above to scan your first one.</Text>
          ) : (
            documents.map((doc) => (
              <View key={doc.id} style={styles.docRow}>
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
              </View>
            ))
          )}
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
  emptyText: { color: '#7F9FCC', fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});
