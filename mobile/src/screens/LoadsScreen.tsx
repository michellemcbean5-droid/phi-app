import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { Ionicons } from '@expo/vector-icons';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const LOADS = [
  { id: 'L001', origin: 'Dallas, TX', destination: 'Atlanta, GA', miles: 781, rate: '$1,950', status: 'In Transit' },
  { id: 'L002', origin: 'Memphis, TN', destination: 'Chicago, IL', miles: 530, rate: '$1,320', status: 'Pending' },
  { id: 'L003', origin: 'Houston, TX', destination: 'Phoenix, AZ', miles: 1,173, rate: '$2,800', status: 'Delivered' },
];

const statusColor: Record<string, string> = {
  'In Transit': '#e94560',
  Pending: '#f5a623',
  Delivered: '#4caf50',
};

export default function LoadsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={LOADS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('LoadDetails', { loadId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.loadId}>Load #{item.id}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor[item.status] }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.route}>
              <Ionicons name="location-outline" size={16} color="#aaa" />
              <Text style={styles.routeText}>{item.origin}</Text>
              <Ionicons name="arrow-forward" size={16} color="#e94560" style={{ marginHorizontal: 6 }} />
              <Ionicons name="location" size={16} color="#e94560" />
              <Text style={styles.routeText}>{item.destination}</Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.detail}>{item.miles} mi</Text>
              <Text style={styles.rate}>{item.rate}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  card: { backgroundColor: '#16213e', borderRadius: 12, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  loadId: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  route: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  routeText: { color: '#ccc', fontSize: 13, marginLeft: 4 },
  details: { flexDirection: 'row', justifyContent: 'space-between' },
  detail: { color: '#aaa', fontSize: 13 },
  rate: { color: '#4caf50', fontWeight: 'bold', fontSize: 16 },
});
