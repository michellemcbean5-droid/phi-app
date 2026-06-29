import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';

// Define proper types for load data
interface LoadData {
  origin: string;
  destination: string;
  miles: number;
  rate: string;
  status: string;
  weight: string;
  commodity: string;
  pickup: string;
  delivery: string;
  broker: string;
  brokerPhone: string;
}

// Define icon names type
type IconName = keyof typeof Ionicons.glyphMap;

const LOAD_DATA: Record<string, LoadData> = {
  L001: { 
    origin: 'Dallas, TX', 
    destination: 'Atlanta, GA', 
    miles: 781, 
    rate: '$1,950', 
    status: 'In Transit', 
    weight: '42,000 lbs', 
    commodity: 'Auto Parts', 
    pickup: 'Jun 26 08:00', 
    delivery: 'Jun 27 18:00', 
    broker: 'Acme Freight', 
    brokerPhone: '(555) 123-4567' 
  },
  L002: { 
    origin: 'Memphis, TN', 
    destination: 'Chicago, IL', 
    miles: 530, 
    rate: '$1,320', 
    status: 'Pending', 
    weight: '38,000 lbs', 
    commodity: 'Electronics', 
    pickup: 'Jun 27 10:00', 
    delivery: 'Jun 28 16:00', 
    broker: 'FastLane Logistics', 
    brokerPhone: '(555) 987-6543' 
  },
  L003: { 
    origin: 'Houston, TX', 
    destination: 'Phoenix, AZ', 
    miles: 1173, 
    rate: '$2,800', 
    status: 'Delivered', 
    weight: '44,000 lbs', 
    commodity: 'Building Materials', 
    pickup: 'Jun 24 06:00', 
    delivery: 'Jun 25 20:00', 
    broker: 'SunBelt Freight', 
    brokerPhone: '(555) 456-7890' 
  },
};

type Props = NativeStackScreenProps<RootStackParamList, 'LoadDetails'>;

// Define row data type
interface RowData {
  icon: IconName;
  label: string;
  value: string;
}

export default function LoadDetailsScreen({ route }: Props) {
  const load = LOAD_DATA[route.params.loadId];

  if (!load) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Load not found.</Text>
      </View>
    );
  }

  const rows: RowData[] = [
    { icon: 'location-outline', label: 'Origin', value: load.origin },
    { icon: 'flag-outline', label: 'Destination', value: load.destination },
    { icon: 'speedometer-outline', label: 'Miles', value: `${load.miles} mi` },
    { icon: 'scale-outline', label: 'Weight', value: load.weight },
    { icon: 'cube-outline', label: 'Commodity', value: load.commodity },
    { icon: 'cash-outline', label: 'Rate', value: load.rate },
    { icon: 'time-outline', label: 'Pickup', value: load.pickup },
    { icon: 'checkmark-circle-outline', label: 'Delivery', value: load.delivery },
    { icon: 'business-outline', label: 'Broker', value: load.broker },
    { icon: 'call-outline', label: 'Broker Phone', value: load.brokerPhone },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Ionicons name={r.icon} size={20} color={PHI_COLORS.error} style={{ width: 28 }} />
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.value}>{r.value}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: PHI_COLORS.surfaceDark 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: PHI_COLORS.surfaceDark, 
    borderRadius: 10, 
    padding: 14, 
    marginBottom: 10 
  },
  label: { 
    color: PHI_COLORS.textTertiary, 
    fontSize: 14, 
    flex: 1, 
    marginLeft: 4 
  },
  value: { 
    color: PHI_COLORS.textPrimary, 
    fontSize: 14, 
    fontWeight: '600', 
    flex: 2, 
    textAlign: 'right' 
  },
  errorText: {
    color: PHI_COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  }
});
