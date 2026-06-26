import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PHI_COLORS } from '../assets/brandColors';

const maintenanceLog = [
  { id: 'mt-1', item: 'Oil Change', date: '2025-06-10', status: 'Completed' },
  { id: 'mt-2', item: 'Brake Inspection', date: '2025-06-17', status: 'Scheduled' },
];

export default function VehicleScreen() {
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [vehicle, setVehicle] = useState({ year: '2022', make: 'Freightliner', model: 'Cascadia', plate: 'PHI-247', vin: '1FUJGLDRXNL123456' });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Truck Details</Text>
          {(
            [
              ['year', 'Year'],
              ['make', 'Make'],
              ['model', 'Model'],
              ['plate', 'Plate'],
              ['vin', 'VIN'],
            ] as const
          ).map(([field, label]) => (
            <View key={field} style={styles.fieldGroup}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                value={vehicle[field]}
                onChangeText={(text) => setVehicle((current) => ({ ...current, [field]: text }))}
                style={styles.input}
                placeholder={label}
                placeholderTextColor="#7F8FB3"
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.title}>GPS Tracking</Text>
              <Text style={styles.helper}>{gpsEnabled ? 'Connected and transmitting live status' : 'Tracking paused'}</Text>
            </View>
            <Switch
              value={gpsEnabled}
              onValueChange={setGpsEnabled}
              thumbColor={gpsEnabled ? PHI_COLORS.sunshineYellow : '#B0B0B0'}
              trackColor={{ false: '#5C6780', true: '#7EA5FF' }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Maintenance Log</Text>
          {maintenanceLog.map((entry) => (
            <View key={entry.id} style={styles.logRow}>
              <View>
                <Text style={styles.label}>{entry.item}</Text>
                <Text style={styles.helper}>{entry.date}</Text>
              </View>
              <Text style={styles.status}>{entry.status}</Text>
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
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 18, padding: 18, gap: 14 },
  title: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800' },
  fieldGroup: { gap: 8 },
  label: { color: PHI_COLORS.white, fontWeight: '700' },
  input: { backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#29508C' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  helper: { color: '#D7E3FF', marginTop: 4 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#21406F', paddingBottom: 10 },
  status: { color: PHI_COLORS.moneyGreen, fontWeight: '800' },
});
