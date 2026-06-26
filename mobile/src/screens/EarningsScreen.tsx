import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const weekly = [
  { day: 'Mon', amount: 620 },
  { day: 'Tue', amount: 980 },
  { day: 'Wed', amount: 750 },
  { day: 'Thu', amount: 1100 },
  { day: 'Fri', amount: 842 },
  { day: 'Sat', amount: 560 },
  { day: 'Sun', amount: 0 },
];

const maxAmount = Math.max(...weekly.map((d) => d.amount));

export default function EarningsScreen() {
  const total = weekly.reduce((sum, d) => sum + d.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>This Week</Text>
          <Text style={styles.totalValue}>${total.toLocaleString()}</Text>
        </View>

        <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        <View style={styles.chart}>
          {weekly.map((d) => (
            <View key={d.day} style={styles.barWrapper}>
              <Text style={styles.barAmount}>{d.amount > 0 ? `$${d.amount}` : ''}</Text>
              <View
                style={[
                  styles.bar,
                  { height: maxAmount > 0 ? (d.amount / maxAmount) * 140 : 4 },
                ]}
              />
              <Text style={styles.barLabel}>{d.day}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Monthly Summary</Text>
        {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, i) => {
          const amt = [4200, 5100, 3900, 4752][i];
          return (
            <View key={week} style={styles.summaryRow}>
              <Text style={styles.weekLabel}>{week}</Text>
              <Text style={styles.weekAmount}>${amt.toLocaleString()}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  totalCard: { backgroundColor: '#e94560', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  totalLabel: { color: '#ffffffcc', fontSize: 14, marginBottom: 4 },
  totalValue: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: '#16213e', borderRadius: 12, padding: 16, marginBottom: 24, height: 200 },
  barWrapper: { alignItems: 'center', flex: 1 },
  barAmount: { color: '#aaa', fontSize: 10, marginBottom: 4 },
  bar: { width: 20, backgroundColor: '#e94560', borderRadius: 4, minHeight: 4 },
  barLabel: { color: '#ccc', fontSize: 12, marginTop: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#16213e', borderRadius: 10, padding: 14, marginBottom: 10 },
  weekLabel: { color: '#ccc', fontSize: 14 },
  weekAmount: { color: '#4caf50', fontWeight: 'bold', fontSize: 14 },
});
