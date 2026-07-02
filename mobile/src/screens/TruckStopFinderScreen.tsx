import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { getCurrentDriverLocation } from '../api/samsaraConnector';
import { findNearbyTruckStops, TruckStopKind, TruckStopPOI } from '../api/truckStopFinder';

const KIND_ICONS: Record<TruckStopKind, keyof typeof Ionicons.glyphMap> = {
  'Fuel / Truck Stop': 'speedometer-outline',
  'Truck Parking': 'car-outline',
  'Rest Area': 'bed-outline',
  'Weigh Station': 'scale-outline',
};

const KIND_COLORS: Record<TruckStopKind, string> = {
  'Fuel / Truck Stop': PHI_COLORS.sunshineYellow,
  'Truck Parking': PHI_COLORS.moneyGreen,
  'Rest Area': '#7EA5FF',
  'Weigh Station': '#FF5252',
};

export default function TruckStopFinderScreen() {
  const [loading, setLoading] = useState(true);
  const [stops, setStops] = useState<TruckStopPOI[]>([]);
  const [filter, setFilter] = useState<TruckStopKind | 'All'>('All');
  const [errored, setErrored] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setErrored(false);
    const location = await getCurrentDriverLocation();
    if (!location) {
      setErrored(true);
      setLoading(false);
      return;
    }
    const results = await findNearbyTruckStops(location, 30);
    setStops(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = filter === 'All' ? stops : stops.filter((s) => s.kind === filter);
  const kinds: (TruckStopKind | 'All')[] = ['All', 'Fuel / Truck Stop', 'Truck Parking', 'Rest Area', 'Weigh Station'];

  const openInMaps = (stop: TruckStopPOI): void => {
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Truck Stops & Parking Near You</Text>
        <Text style={styles.headerSub}>Fuel, truck parking, rest areas, and weigh stations — live from OpenStreetMap, within 30 miles.</Text>
      </View>

      <View style={styles.filterRow}>
        {kinds.map((k) => (
          <TouchableOpacity key={k} style={[styles.chip, filter === k && styles.chipActive]} onPress={() => setFilter(k)}>
            <Text style={[styles.chipText, filter === k && styles.chipTextActive]}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PHI_COLORS.sunshineYellow} />
          <Text style={styles.centerText}>Finding nearby stops...</Text>
        </View>
      ) : errored ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>Enable location access to find nearby truck stops and parking.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void load()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>No results found nearby yet — try again on the road, or pull to refresh.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={() => void load()}
          refreshing={loading}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => openInMaps(item)}>
              <Ionicons name={KIND_ICONS[item.kind]} size={22} color={KIND_COLORS[item.kind]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowKind}>{item.kind}</Text>
              </View>
              <Text style={styles.rowDistance}>{item.distanceMiles} mi</Text>
              <Ionicons name="navigate-outline" size={18} color="#7F9FCC" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  headerCard: { backgroundColor: PHI_COLORS.royalBlue, padding: 16, gap: 4 },
  headerTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '900' },
  headerSub: { color: '#D7E3FF', fontSize: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  chip: { backgroundColor: PHI_COLORS.card, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#29508C' },
  chipActive: { backgroundColor: PHI_COLORS.sunshineYellow, borderColor: PHI_COLORS.sunshineYellow },
  chipText: { color: '#D7E3FF', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: PHI_COLORS.charcoalBlack },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  centerText: { color: '#A8B7D8', textAlign: 'center', fontSize: 13, lineHeight: 20 },
  retryButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  retryButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800' },
  list: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: PHI_COLORS.card, borderRadius: 14, padding: 14 },
  rowName: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 14 },
  rowKind: { color: '#7F9FCC', fontSize: 11, marginTop: 2 },
  rowDistance: { color: PHI_COLORS.sunshineYellow, fontWeight: '800', fontSize: 13 },
});
