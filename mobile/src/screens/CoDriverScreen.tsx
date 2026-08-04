/**
 * CoDriverScreen — Find a nearby driver to team-drive with
 *
 * - GPS-based discovery (25 / 50 / 100 mi radius)
 * - Driver cards: CDL class, rating, endorsements, availability
 * - Request co-driver flow with split-pay config
 * - "Looking for co-driver" toggle
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';

type CDLClass = 'A' | 'B' | 'C';
type Endorsement = 'HazMat' | 'Tanker' | 'Doubles' | 'Passenger' | 'School Bus';

interface NearbyDriver {
  id: string;
  name: string;
  cdlClass: CDLClass;
  rating: number;
  milesDriven: number;
  specialty: string;
  endorsements: Endorsement[];
  distanceMi: number;
  availableNow: boolean;
  lookingForCoDriver: boolean;
  verified: boolean;
  city: string;
  state: string;
  splitPreference: number; // % driver keeps (rest goes to co-driver)
}

// Mock nearby drivers — in production, replace with GET /api/v1/drivers/nearby
const MOCK_DRIVERS: NearbyDriver[] = [
  {
    id: 'd1',
    name: 'Marcus J.',
    cdlClass: 'A',
    rating: 4.9,
    milesDriven: 487_000,
    specialty: 'Dry Van / Reefer',
    endorsements: ['Tanker', 'HazMat'],
    distanceMi: 18,
    availableNow: true,
    lookingForCoDriver: true,
    verified: true,
    city: 'Dallas',
    state: 'TX',
    splitPreference: 55,
  },
  {
    id: 'd2',
    name: 'Darnell W.',
    cdlClass: 'A',
    rating: 4.7,
    milesDriven: 312_000,
    specialty: 'Flatbed',
    endorsements: ['Doubles'],
    distanceMi: 34,
    availableNow: true,
    lookingForCoDriver: true,
    verified: true,
    city: 'Fort Worth',
    state: 'TX',
    splitPreference: 50,
  },
  {
    id: 'd3',
    name: 'Sandra T.',
    cdlClass: 'A',
    rating: 5.0,
    milesDriven: 624_000,
    specialty: 'OTR / Long Haul',
    endorsements: ['HazMat', 'Tanker', 'Doubles'],
    distanceMi: 47,
    availableNow: false,
    lookingForCoDriver: true,
    verified: true,
    city: 'Arlington',
    state: 'TX',
    splitPreference: 60,
  },
  {
    id: 'd4',
    name: 'Kevin P.',
    cdlClass: 'A',
    rating: 4.5,
    milesDriven: 198_000,
    specialty: 'Dry Van',
    endorsements: [],
    distanceMi: 72,
    availableNow: true,
    lookingForCoDriver: false,
    verified: false,
    city: 'Waco',
    state: 'TX',
    splitPreference: 50,
  },
  {
    id: 'd5',
    name: 'Tanya R.',
    cdlClass: 'B',
    rating: 4.8,
    milesDriven: 95_000,
    specialty: 'Local / Regional',
    endorsements: ['Passenger'],
    distanceMi: 88,
    availableNow: true,
    lookingForCoDriver: true,
    verified: true,
    city: 'Austin',
    state: 'TX',
    splitPreference: 50,
  },
];

const RADIUS_OPTIONS = [25, 50, 100] as const;
type Radius = (typeof RADIUS_OPTIONS)[number];

export default function CoDriverScreen() {
  const [radius, setRadius] = useState<Radius>(50);
  const [lookingToggle, setLookingToggle] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<NearbyDriver | null>(null);
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [mySplit, setMySplit] = useState('55');

  const drivers = useMemo(
    () => MOCK_DRIVERS.filter((d) => d.distanceMi <= radius),
    [radius],
  );

  const handleRequest = (driver: NearbyDriver) => {
    setSelectedDriver(driver);
    setMySplit(String(driver.splitPreference));
    setSplitModalVisible(true);
  };

  const handleSendRequest = () => {
    const split = Number(mySplit);
    if (split < 1 || split > 99) {
      Alert.alert('Invalid split', 'Enter a number between 1 and 99.');
      return;
    }
    setSplitModalVisible(false);
    Alert.alert(
      'Request Sent! 🚛',
      `Co-driver request sent to ${selectedDriver?.name}.\nRevenue split: You ${split}% / Co-driver ${100 - split}%`,
    );
    setSelectedDriver(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="people" size={22} color={PHI_COLORS.sunshineYellow} />
        <Text style={styles.headerTitle}>Find a Co-Driver</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* My availability toggle */}
        <View style={styles.myStatusCard}>
          <View style={styles.myStatusLeft}>
            <Text style={styles.myStatusTitle}>Looking for Co-Driver</Text>
            <Text style={styles.myStatusSub}>
              {lookingToggle ? 'Visible to nearby drivers' : 'Hidden from search'}
            </Text>
          </View>
          <Switch
            value={lookingToggle}
            onValueChange={setLookingToggle}
            trackColor={{ false: '#29508C', true: PHI_COLORS.moneyGreen }}
            thumbColor={PHI_COLORS.white}
          />
        </View>

        {/* Radius selector */}
        <View style={styles.radiusRow}>
          <Text style={styles.radiusLabel}>Search Radius:</Text>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
              onPress={() => setRadius(r)}
            >
              <Text style={[styles.radiusChipText, radius === r && styles.radiusChipTextActive]}>
                {r} mi
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Results header */}
        <Text style={styles.sectionTitle}>
          {drivers.length} drivers within {radius} miles
        </Text>

        {drivers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color="#29508C" />
            <Text style={styles.emptyText}>No co-drivers found in this radius. Try expanding.</Text>
          </View>
        )}

        {/* Driver cards */}
        {drivers.map((driver) => (
          <DriverCard key={driver.id} driver={driver} onRequest={() => handleRequest(driver)} />
        ))}
      </ScrollView>

      {/* Split-pay modal */}
      <Modal
        visible={splitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSplitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Revenue Split</Text>
            <Text style={styles.modalSub}>
              Set your revenue share before sending the request to {selectedDriver?.name}.
            </Text>
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                <Text style={styles.splitLabel}>Your share (%)</Text>
                <TextInput
                  style={styles.splitInput}
                  value={mySplit}
                  onChangeText={setMySplit}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.splitDivider}>
                <Text style={styles.splitDividerText}>/</Text>
              </View>
              <View style={styles.splitCol}>
                <Text style={styles.splitLabel}>Co-driver (%)</Text>
                <View style={styles.splitReadOnly}>
                  <Text style={styles.splitReadOnlyText}>
                    {Math.max(0, 100 - (Number(mySplit) || 0))}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setSplitModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleSendRequest}>
                <Text style={styles.modalConfirmText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── DriverCard ────────────────────────────────────────────────────────────────

function DriverCard({
  driver,
  onRequest,
}: {
  driver: NearbyDriver;
  onRequest: () => void;
}) {
  return (
    <View style={styles.driverCard}>
      {/* Avatar + name row */}
      <View style={styles.driverTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{driver.name.charAt(0)}</Text>
        </View>
        <View style={styles.driverInfo}>
          <View style={styles.driverNameRow}>
            <Text style={styles.driverName}>{driver.name}</Text>
            {driver.verified && (
              <Ionicons name="checkmark-circle" size={16} color={PHI_COLORS.moneyGreen} />
            )}
          </View>
          <Text style={styles.driverLocation}>
            {driver.city}, {driver.state} · {driver.distanceMi} mi away
          </Text>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color={PHI_COLORS.sunshineYellow} />
          <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatChip label="CDL" value={`Class ${driver.cdlClass}`} />
        <StatChip label="Miles" value={`${(driver.milesDriven / 1000).toFixed(0)}k`} />
        <StatChip label="Split Pref" value={`${driver.splitPreference}/${100 - driver.splitPreference}`} />
      </View>

      {/* Specialty */}
      <Text style={styles.specialty}>{driver.specialty}</Text>

      {/* Endorsements */}
      {driver.endorsements.length > 0 && (
        <View style={styles.endorsementsRow}>
          {driver.endorsements.map((e) => (
            <View key={e} style={styles.endorsementChip}>
              <Text style={styles.endorsementText}>{e}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Status + action */}
      <View style={styles.driverBottom}>
        <View style={[styles.statusDot, { backgroundColor: driver.availableNow ? PHI_COLORS.moneyGreen : '#555' }]} />
        <Text style={styles.statusText}>{driver.availableNow ? 'Available Now' : 'Unavailable'}</Text>
        {driver.lookingForCoDriver && (
          <View style={styles.lookingBadge}>
            <Text style={styles.lookingBadgeText}>Seeking Team</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.requestBtn, !driver.availableNow && styles.requestBtnDisabled]}
          onPress={onRequest}
          disabled={!driver.availableNow}
        >
          <Text style={styles.requestBtnText}>Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: PHI_COLORS.royalBlue,
  },
  headerTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '900', flex: 1 },
  content: { padding: 16, gap: 14 },
  myStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PHI_COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  myStatusLeft: { flex: 1 },
  myStatusTitle: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 15 },
  myStatusSub: { color: '#7F9FCC', fontSize: 12, marginTop: 2 },
  radiusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  radiusLabel: { color: '#D7E3FF', fontWeight: '700', fontSize: 13 },
  radiusChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: PHI_COLORS.card,
    borderWidth: 1,
    borderColor: '#29508C',
  },
  radiusChipActive: { backgroundColor: PHI_COLORS.royalBlue, borderColor: PHI_COLORS.royalBlue },
  radiusChipText: { color: '#D7E3FF', fontWeight: '700', fontSize: 13 },
  radiusChipTextActive: { color: PHI_COLORS.white },
  sectionTitle: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { color: '#7F9FCC', fontSize: 13, textAlign: 'center' },
  driverCard: {
    backgroundColor: PHI_COLORS.card,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  driverTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PHI_COLORS.royalBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 18 },
  driverInfo: { flex: 1 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  driverName: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 15 },
  driverLocation: { color: '#7F9FCC', fontSize: 12, marginTop: 2 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0A1628',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ratingText: { color: PHI_COLORS.sunshineYellow, fontWeight: '800', fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flex: 1,
    backgroundColor: '#0A1628',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  statValue: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 13 },
  statLabel: { color: '#7F9FCC', fontSize: 9, marginTop: 2 },
  specialty: { color: '#D7E3FF', fontSize: 12 },
  endorsementsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  endorsementChip: {
    backgroundColor: '#0D2A50',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: PHI_COLORS.royalBlue,
  },
  endorsementText: { color: PHI_COLORS.sunshineYellow, fontWeight: '700', fontSize: 10 },
  driverBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#D7E3FF', fontSize: 12, flex: 1 },
  lookingBadge: {
    backgroundColor: '#1A3A1A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lookingBadgeText: { color: PHI_COLORS.moneyGreen, fontWeight: '700', fontSize: 10 },
  requestBtn: {
    backgroundColor: PHI_COLORS.sunshineYellow,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  requestBtnDisabled: { backgroundColor: '#29508C' },
  requestBtnText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 12 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: PHI_COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 14,
  },
  modalTitle: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 20 },
  modalSub: { color: '#D7E3FF', fontSize: 13, lineHeight: 19 },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  splitCol: { flex: 1, gap: 6 },
  splitLabel: { color: '#7F9FCC', fontSize: 12, fontWeight: '700' },
  splitInput: {
    backgroundColor: '#0A1628',
    color: PHI_COLORS.white,
    borderRadius: 12,
    padding: 12,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: PHI_COLORS.royalBlue,
  },
  splitDivider: { alignItems: 'center', justifyContent: 'center' },
  splitDividerText: { color: '#7F9FCC', fontSize: 24, fontWeight: '900' },
  splitReadOnly: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  splitReadOnlyText: { color: '#7F9FCC', fontSize: 24, fontWeight: '900' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1,
    backgroundColor: '#0A1628',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  modalCancelText: { color: '#D7E3FF', fontWeight: '700' },
  modalConfirm: {
    flex: 1,
    backgroundColor: PHI_COLORS.sunshineYellow,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  modalConfirmText: { color: PHI_COLORS.charcoalBlack, fontWeight: '900' },
});
