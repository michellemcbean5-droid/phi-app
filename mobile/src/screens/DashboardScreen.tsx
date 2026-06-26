import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import { WORKER_DEFINITIONS } from '../workers/workers-15x';

const kpis = [
  { label: 'Revenue', value: '$4,852' },
  { label: 'Active Workers', value: '12' },
  { label: 'Jobs Today', value: '8' },
  { label: 'System Health', value: '98%' },
] as const;

type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const animationValues = useRef(kpis.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      100,
      animationValues.map((value) =>
        Animated.spring(value, {
          toValue: 1,
          useNativeDriver: true,
          friction: 7,
        }),
      ),
    ).start();
  }, [animationValues]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Prince Haul Intelligence</Text>
        <Text style={styles.subtitle}>Your master production dashboard for revenue, automation, and dispatch visibility.</Text>

        <View style={styles.kpiGrid}>
          {kpis.map((kpi, index) => (
            <Animated.View
              key={kpi.label}
              style={[
                styles.kpiCard,
                {
                  opacity: animationValues[index],
                  transform: [
                    {
                      translateY: animationValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </Animated.View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('AICommandCenter')}>
            <Text style={styles.primaryButtonText}>Open AI Command Center</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Compliance')}>
            <Text style={styles.secondaryButtonText}>Review Compliance</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Loads')}>
            <Text style={styles.secondaryButtonText}>View Loads</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Subscription')}>
            <Text style={styles.secondaryButtonText}>Manage Plan</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>15-Worker Status Grid</Text>
        <View style={styles.workerGrid}>
          {WORKER_DEFINITIONS.map((worker) => (
            <View key={worker.id} style={styles.workerCard}>
              <View
                style={[
                  styles.workerIndicator,
                  { backgroundColor: worker.status === 'active' ? PHI_COLORS.moneyGreen : PHI_COLORS.charcoalBlack },
                ]}
              />
              <Text style={styles.workerName}>{worker.name}</Text>
              <Text style={styles.workerTasks}>{worker.tasksToday} tasks today</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.royalBlue },
  content: { padding: 16, gap: 16 },
  title: { color: PHI_COLORS.white, fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#E7EEFF', lineHeight: 20 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: { width: '47%', backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 18, padding: 18 },
  kpiValue: { color: PHI_COLORS.charcoalBlack, fontSize: 26, fontWeight: '900' },
  kpiLabel: { color: PHI_COLORS.charcoalBlack, marginTop: 8, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12 },
  primaryButton: { flex: 1, backgroundColor: PHI_COLORS.sunshineYellow, padding: 14, borderRadius: 14 },
  secondaryButton: { flex: 1, backgroundColor: PHI_COLORS.card, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#7EA5FF' },
  primaryButtonText: { color: PHI_COLORS.charcoalBlack, textAlign: 'center', fontWeight: '800' },
  secondaryButtonText: { color: PHI_COLORS.white, textAlign: 'center', fontWeight: '800' },
  sectionTitle: { color: PHI_COLORS.white, fontSize: 20, fontWeight: '800', marginTop: 8 },
  workerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  workerCard: { width: '47%', backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 14 },
  workerIndicator: { width: 14, height: 14, borderRadius: 7, marginBottom: 10 },
  workerName: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 13 },
  workerTasks: { color: '#D7E3FF', marginTop: 8, fontSize: 12 },
});
