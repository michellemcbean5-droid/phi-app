import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHI_COLORS } from '../assets/brandColors';

const documents = [
  { id: 'doc-1', name: 'Bill of Lading - DAT-101.pdf', status: 'Received' },
  { id: 'doc-2', name: 'Rate Confirmation - TS-301.pdf', status: 'Pending Review' },
  { id: 'doc-3', name: 'Insurance Certificate.pdf', status: 'Archived' },
];

const showUploadPlaceholder = (type: string): void => {
  Alert.alert('Upload Document', `${type} upload will open the camera or file picker in the production build.`, [{ text: 'OK' }]);
};

export default function DocumentsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.uploadCard} onPress={() => showUploadPlaceholder('Bill of Lading')}>
          <Text style={styles.uploadTitle}>Upload Bill of Lading</Text>
          <Text style={styles.uploadText}>Tap to add delivery paperwork</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadCard} onPress={() => showUploadPlaceholder('Rate Confirmation')}>
          <Text style={styles.uploadTitle}>Upload Rate Confirmation</Text>
          <Text style={styles.uploadText}>Tap to add broker confirmation</Text>
        </TouchableOpacity>

        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Document Center</Text>
          {documents.map((document) => (
            <View key={document.id} style={styles.documentRow}>
              <View>
                <Text style={styles.documentName}>{document.name}</Text>
                <Text style={styles.documentStatus}>{document.status}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>PHI</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
  uploadCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 18, padding: 18 },
  uploadTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800' },
  uploadText: { color: '#D7E3FF', marginTop: 8 },
  listCard: { backgroundColor: PHI_COLORS.card, borderRadius: 18, padding: 18, gap: 12 },
  listTitle: { color: PHI_COLORS.sunshineYellow, fontSize: 18, fontWeight: '700' },
  documentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#21406F', paddingBottom: 10 },
  documentName: { color: PHI_COLORS.white, fontWeight: '700', maxWidth: 240 },
  documentStatus: { color: '#D7E3FF', marginTop: 4 },
  badge: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800' },
});
