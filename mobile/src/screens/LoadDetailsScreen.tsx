import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import useLoadsStore from '../store/loadsStore';
import { Load } from '../workers/workers-15x';

type Props = NativeStackScreenProps<RootStackParamList, 'LoadDetails'>;

interface LoadDetailRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export default function LoadDetailsScreen({ route }: Props) {
  const { activeLoads } = useLoadsStore();
  const loadId = route.params.loadId;
  
  // Find the load from activeLoads
  const load = activeLoads.find(l => l.id === loadId);

  if (!load) return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.row}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Load not found.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const rows: LoadDetailRow[] = [
    { icon: 'location-outline', label: 'Origin', value: `${load.origin.city}, ${load.origin.state}` },
    { icon: 'flag-outline', label: 'Destination', value: `${load.destination.city}, ${load.destination.state}` },
    { icon: 'speedometer-outline', label: 'Miles', value: `${load.miles} mi` },
    { icon: 'scale-outline', label: 'Weight', value: `${load.weightLbs} lbs` },
    { icon: 'cube-outline', label: 'Equipment', value: load.equipmentType },
    { icon: 'cash-outline', label: 'Rate', value: `$${load.rate.toFixed(2)}` },
    { icon: 'cash-outline', label: 'RPM', value: `$${load.rpm.toFixed(2)}` },
    { icon: 'time-outline', label: 'Pickup Date', value: load.pickupDate },
    { icon: 'checkmark-circle-outline', label: 'Delivery Date', value: load.deliveryDate },
    { icon: 'business-outline', label: 'Broker', value: load.brokerName },
    { icon: 'star-outline', label: 'Broker Rating', value: `${load.brokerRating.toFixed(1)}/5.0` },
    { icon: 'pulse-outline', label: 'Source', value: load.source },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.header}>
          <Text style={styles.loadId}>{load.id}</Text>
          <Text style={styles.status}>Status: Available</Text>
        </View>
        
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Ionicons name={r.icon} size={20} color={PHI_COLORS.sunshineYellow} style={{ width: 28 }} />
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.value}>{r.value}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  header: { marginBottom: 20, alignItems: 'center' },
  loadId: { color: PHI_COLORS.white, fontSize: 24, fontWeight: '900', marginBottom: 5 },
  status: { color: PHI_COLORS.moneyGreen, fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  label: { color: '#A8B7D8', fontSize: 14, flex: 1, marginLeft: 4 },
  value: { color: PHI_COLORS.white, fontSize: 14, fontWeight: '700', flex: 2, textAlign: 'right' },
});
