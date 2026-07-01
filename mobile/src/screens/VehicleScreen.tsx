import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import useVehicleStore, { VehicleRecord } from '../store/vehicleStore';
import usePromoStore from '../store/promoStore';
import { getTruckLimit } from '../utils/subscriptionGating';

type VehicleNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Vehicle'>;

const FIELDS: { key: keyof Pick<VehicleRecord, 'year' | 'make' | 'model' | 'plate' | 'vin'>; label: string }[] = [
  { key: 'year', label: 'Year' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'plate', label: 'Plate' },
  { key: 'vin', label: 'VIN' },
];

export default function VehicleScreen() {
  const navigation = useNavigation<VehicleNavigationProp>();
  const { vehicles, addVehicle, updateVehicle, toggleGps, removeVehicle } = useVehicleStore();
  const { getEffectiveTier } = usePromoStore();
  const truckLimit = getTruckLimit(getEffectiveTier());

  const handleAddVehicle = (): void => {
    if (vehicles.length >= truckLimit) {
      Alert.alert(
        'Fleet Limit Reached',
        `Your current plan supports ${truckLimit === Number.POSITIVE_INFINITY ? 'unlimited' : truckLimit} truck${truckLimit === 1 ? '' : 's'}/vans. Upgrade to add more.`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade Plan', onPress: () => navigation.navigate('Subscription') },
        ],
      );
      return;
    }
    addVehicle();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.fleetLabel}>
            {vehicles.length} of {truckLimit === Number.POSITIVE_INFINITY ? '∞' : truckLimit} trucks/vans
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddVehicle}>
            <Ionicons name="add" size={18} color={PHI_COLORS.charcoalBlack} />
            <Text style={styles.addButtonText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>

        {vehicles.map((vehicle, index) => (
          <View key={vehicle.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.title}>{vehicle.make || vehicle.model ? `${vehicle.make} ${vehicle.model}`.trim() : `Vehicle ${index + 1}`}</Text>
              {vehicles.length > 1 && (
                <TouchableOpacity onPress={() => removeVehicle(vehicle.id)}>
                  <Ionicons name="trash-outline" size={18} color="#FF5252" />
                </TouchableOpacity>
              )}
            </View>
            {FIELDS.map(({ key, label }) => (
              <View key={key} style={styles.fieldGroup}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  value={vehicle[key]}
                  onChangeText={(text) => updateVehicle(vehicle.id, key, text)}
                  style={styles.input}
                  placeholder={label}
                  placeholderTextColor="#7F8FB3"
                />
              </View>
            ))}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.title}>GPS Tracking</Text>
                <Text style={styles.helper}>{vehicle.gpsEnabled ? 'Connected and transmitting live status' : 'Tracking paused'}</Text>
              </View>
              <Switch
                value={vehicle.gpsEnabled}
                onValueChange={() => toggleGps(vehicle.id)}
                thumbColor={vehicle.gpsEnabled ? PHI_COLORS.sunshineYellow : '#B0B0B0'}
                trackColor={{ false: '#5C6780', true: '#7EA5FF' }}
              />
            </View>
          </View>
        ))}

        <View style={styles.card}>
          <Text style={styles.title}>Maintenance Log</Text>
          <Text style={styles.helper}>No maintenance logged yet — the Fleet Maintenance worker will track it here as you go.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fleetLabel: { color: '#A8B7D8', fontWeight: '700', fontSize: 13 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  addButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 12 },
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 18, padding: 18, gap: 14 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '800' },
  fieldGroup: { gap: 8 },
  label: { color: PHI_COLORS.white, fontWeight: '700' },
  input: { backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#29508C' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  helper: { color: '#D7E3FF', marginTop: 4 },
});
