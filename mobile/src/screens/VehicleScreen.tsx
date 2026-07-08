import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import useVehicleStore, { VehicleRecord } from '../store/vehicleStore';
import usePromoStore from '../store/promoStore';
import { getTruckLimit } from '../utils/subscriptionGating';
import { getMaintenanceSuggestions, MaintenanceStatus } from '../utils/vehicleMaintenance';

type VehicleNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Vehicle'>;

const FIELDS: { key: keyof Pick<VehicleRecord, 'year' | 'make' | 'model' | 'plate' | 'vin'>; label: string }[] = [
  { key: 'year', label: 'Year' },
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'plate', label: 'Plate' },
  { key: 'vin', label: 'VIN' },
];

const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  ok: PHI_COLORS.moneyGreen,
  'due-soon': PHI_COLORS.sunshineYellow,
  overdue: '#FF5252',
};

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  ok: 'On track',
  'due-soon': 'Due soon',
  overdue: 'Overdue',
};

const pickVehiclePhoto = async (vehicleId: string, setPhoto: (id: string, uri: string) => void): Promise<void> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Photo Access Needed', 'Allow photo library access in your phone settings to add a truck photo.');
    return;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
  if (result.canceled || !result.assets?.[0]) return;
  setPhoto(vehicleId, result.assets[0].uri);
};

export default function VehicleScreen() {
  const navigation = useNavigation<VehicleNavigationProp>();
  const { vehicles, addVehicle, updateVehicle, setPhoto, toggleGps, removeVehicle } = useVehicleStore();
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

        {vehicles.map((vehicle, index) => {
          const mileage = Number(vehicle.mileage) || 0;
          const suggestions = getMaintenanceSuggestions(mileage);
          return (
            <View key={vehicle.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.title}>{vehicle.make || vehicle.model ? `${vehicle.make} ${vehicle.model}`.trim() : `Vehicle ${index + 1}`}</Text>
                {vehicles.length > 1 && (
                  <TouchableOpacity onPress={() => removeVehicle(vehicle.id)}>
                    <Ionicons name="trash-outline" size={18} color="#FF5252" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.photoWrap} onPress={() => void pickVehiclePhoto(vehicle.id, setPhoto)}>
                {vehicle.photoUri ? (
                  <Image source={{ uri: vehicle.photoUri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera-outline" size={28} color="#7F8FB3" />
                    <Text style={styles.photoPlaceholderText}>Add a photo of your truck</Text>
                  </View>
                )}
              </TouchableOpacity>

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

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Current Mileage</Text>
                <TextInput
                  value={vehicle.mileage}
                  onChangeText={(text) => updateVehicle(vehicle.id, 'mileage', text.replace(/[^0-9]/g, ''))}
                  style={styles.input}
                  placeholder="e.g. 185000"
                  placeholderTextColor="#7F8FB3"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchTextWrap}>
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

              <View style={styles.maintenanceSection}>
                <Text style={styles.title}>Maintenance Suggestions</Text>
                {mileage <= 0 ? (
                  <Text style={styles.helper}>Enter your current mileage above to get maintenance timing suggestions.</Text>
                ) : (
                  suggestions.map((s) => (
                    <View key={s.item} style={styles.maintenanceRow}>
                      <View style={styles.maintenanceTextWrap}>
                        <Text style={styles.label}>{s.item}</Text>
                        <Text style={styles.helper}>
                          {s.status === 'overdue'
                            ? `${Math.abs(s.milesUntilDue).toLocaleString()} mi past the ${s.intervalMiles.toLocaleString()}-mi interval`
                            : `${s.milesUntilDue.toLocaleString()} mi until next service (every ${s.intervalMiles.toLocaleString()} mi)`}
                        </Text>
                      </View>
                      <View style={[styles.maintenanceBadge, { backgroundColor: STATUS_COLORS[s.status] + '33' }]}>
                        <Text style={[styles.maintenanceBadgeText, { color: STATUS_COLORS[s.status] }]}>
                          {STATUS_LABELS[s.status]}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          );
        })}
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
  switchTextWrap: { flex: 1, flexShrink: 1 },
  helper: { color: '#D7E3FF', marginTop: 4 },
  photoWrap: { borderRadius: 14, overflow: 'hidden' },
  photo: { width: '100%', height: 160, backgroundColor: '#132B52' },
  photoPlaceholder: { width: '100%', height: 160, backgroundColor: '#132B52', borderRadius: 14, borderWidth: 1, borderColor: '#29508C', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoPlaceholderText: { color: '#7F8FB3', fontSize: 12, fontWeight: '600' },
  maintenanceSection: { gap: 10, borderTopWidth: 1, borderTopColor: '#21406F', paddingTop: 14 },
  maintenanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  maintenanceTextWrap: { flex: 1, flexShrink: 1 },
  maintenanceBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  maintenanceBadgeText: { fontWeight: '800', fontSize: 11 },
});
