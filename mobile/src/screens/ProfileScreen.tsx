import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
  { icon: 'document-text-outline', label: 'My Documents' },
  { icon: 'car-outline', label: 'My Vehicle' },
  { icon: 'shield-checkmark-outline', label: 'Insurance & Compliance' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'settings-outline', label: 'Settings' },
  { icon: 'help-circle-outline', label: 'Help & Support' },
  { icon: 'log-out-outline', label: 'Sign Out' },
] as const;

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={60} color="#fff" />
        </View>
        <Text style={styles.name}>Prince Haul Driver</Text>
        <Text style={styles.cdl}>CDL-A • MC #123456</Text>

        <View style={styles.statsRow}>
          {[['2.1M', 'Miles Driven'], ['98%', 'On-Time'], ['4.9★', 'Rating']].map(([val, lbl]) => (
            <View key={lbl} style={styles.statBox}>
              <Text style={styles.statVal}>{val}</Text>
              <Text style={styles.statLbl}>{lbl}</Text>
            </View>
          ))}
        </View>

        {menuItems.map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuRow}>
            <Ionicons name={item.icon} size={22} color="#e94560" style={{ width: 32 }} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#555" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e94560', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  cdl: { color: '#aaa', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#16213e', borderRadius: 12, padding: 16, marginBottom: 24 },
  statBox: { alignItems: 'center' },
  statVal: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  statLbl: { color: '#aaa', fontSize: 11, marginTop: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 10, padding: 14, marginBottom: 10 },
  menuLabel: { color: '#fff', flex: 1, fontSize: 15 },
});
