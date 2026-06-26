import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const stats = [
  { label: 'Active Loads', value: '3', icon: 'cube-outline' as const, color: '#e94560' },
  { label: 'Miles Today', value: '287', icon: 'speedometer-outline' as const, color: '#0f3460' },
  { label: "Today's Earnings", value: '$842', icon: 'cash-outline' as const, color: '#16213e' },
  { label: 'Fuel Stops', value: '2', icon: 'flame-outline' as const, color: '#533483' },
];

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>Good morning, Driver 👋</Text>
        <Text style={styles.subtitle}>Prince Haul Intelligence</Text>

        <View style={styles.grid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.card, { borderLeftColor: s.color }]}>
              <Ionicons name={s.icon} size={28} color={s.color} />
              <Text style={styles.cardValue}>{s.value}</Text>
              <Text style={styles.cardLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actions}>
          {['Log Hours', 'Report Issue', 'Find Fuel', 'Contact Dispatch'].map((action) => (
            <TouchableOpacity key={action} style={styles.actionBtn}>
              <Text style={styles.actionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  scroll: { padding: 16 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#aaa', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderLeftWidth: 4,
    alignItems: 'flex-start',
  },
  cardValue: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  cardLabel: { fontSize: 12, color: '#aaa', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionText: { color: '#fff', fontWeight: '600' },
});
