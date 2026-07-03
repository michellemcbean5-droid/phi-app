import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TabParamList } from '../navigation/TabNavigator';
import useAuthStore from '../store/authStore';
import useProfileStore from '../store/profileStore';
import useLoadsStore from '../store/loadsStore';
import useDocumentsStore from '../store/documentsStore';

type ProfileNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type ProfileMenuAction =
  | 'AICommandCenter'
  | 'Documents'
  | 'Vehicle'
  | 'Compliance'
  | 'Notifications'
  | 'Settings'
  | 'Subscription'
  | 'signOut';

const menuItems: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  action: ProfileMenuAction;
}> = [
  { icon: 'hardware-chip-outline', label: 'AI Command Center', action: 'AICommandCenter' },
  { icon: 'document-text-outline', label: 'My Documents', action: 'Documents' },
  { icon: 'car-outline', label: 'My Vehicle', action: 'Vehicle' },
  { icon: 'shield-checkmark-outline', label: 'Insurance & Compliance', action: 'Compliance' },
  { icon: 'notifications-outline', label: 'Notifications', action: 'Notifications' },
  { icon: 'settings-outline', label: 'Settings', action: 'Settings' },
  { icon: 'card-outline', label: 'Subscription', action: 'Subscription' },
  { icon: 'log-out-outline', label: 'Sign Out', action: 'signOut' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const logout = useAuthStore((state) => state.logout);
  const { fullName, phone, cdlNumber, cdlState, cdlClass, mcNumber, dotNumber, equipmentType, setField, isComplete } = useProfileStore();
  const { bookingHistory } = useLoadsStore();
  const { documents } = useDocumentsStore();

  const totalMiles = bookingHistory.reduce((sum, record) => sum + record.miles, 0);
  const milesDisplay = totalMiles >= 1000 ? `${(totalMiles / 1000).toFixed(1)}K` : String(totalMiles);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={60} color={PHI_COLORS.white} />
        </View>
        <Text style={styles.name}>{fullName.trim() || 'Add your name below'}</Text>
        <Text style={styles.cdl}>{cdlNumber.trim() ? `CDL${cdlClass ? `-${cdlClass}` : ''} · ${cdlState || '??'} ${cdlNumber}` : 'CDL not on file yet'}</Text>

        {!isComplete() && (
          <View style={styles.incompleteBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={PHI_COLORS.charcoalBlack} />
            <Text style={styles.incompleteBannerText}>
              Add your name and CDL info so it's ready when brokers ask — it's what makes booking look professional.
            </Text>
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>Driver Identity</Text>
          {(
            [
              ['fullName', 'Full Legal Name', fullName, 'e.g. John A. Smith'],
              ['phone', 'Phone Number', phone, 'e.g. (555) 123-4567'],
              ['cdlNumber', 'CDL Number', cdlNumber, 'e.g. 12345678'],
              ['cdlState', 'CDL State', cdlState, 'e.g. TX'],
              ['cdlClass', 'CDL Class', cdlClass, 'A, B, or C'],
            ] as const
          ).map(([field, label, value, placeholder]) => (
            <View key={field} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                value={value}
                onChangeText={(text) => setField(field, field === 'cdlState' || field === 'cdlClass' ? text.toUpperCase() : text)}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#7F8FB3"
                autoCapitalize={field === 'fullName' ? 'words' : 'characters'}
                keyboardType={field === 'phone' ? 'phone-pad' : 'default'}
              />
            </View>
          ))}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>Carrier Info</Text>
          {(
            [
              ['mcNumber', 'MC Number', mcNumber, 'e.g. MC-123456'],
              ['dotNumber', 'DOT Number', dotNumber, 'e.g. DOT-987654'],
              ['equipmentType', 'Equipment Type', equipmentType, "e.g. 53' Dry Van"],
            ] as const
          ).map(([field, label, value, placeholder]) => (
            <View key={field} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                value={value}
                onChangeText={(text) => setField(field, text)}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#7F8FB3"
              />
            </View>
          ))}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{milesDisplay}</Text>
            <Text style={styles.statLbl}>Miles Driven</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{bookingHistory.length}</Text>
            <Text style={styles.statLbl}>Loads Booked</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{documents.length}</Text>
            <Text style={styles.statLbl}>Documents</Text>
          </View>
        </View>

        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuRow}
            onPress={() => {
              if (item.action === 'signOut') {
                logout();
                return;
              }
              navigation.navigate(item.action);
            }}
          >
            <Ionicons name={item.icon} size={22} color={PHI_COLORS.sunshineYellow} style={{ width: 32 }} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#A8B7D8" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: PHI_COLORS.royalBlue, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  name: { color: PHI_COLORS.white, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  cdl: { color: '#D7E3FF', textAlign: 'center' },
  incompleteBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 14, padding: 14 },
  incompleteBannerText: { flex: 1, flexShrink: 1, color: PHI_COLORS.charcoalBlack, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  formCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 12 },
  formCardTitle: { color: PHI_COLORS.sunshineYellow, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: PHI_COLORS.white, fontWeight: '700' },
  input: { backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#29508C' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16 },
  statBox: { alignItems: 'center' },
  statVal: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 18 },
  statLbl: { color: '#D7E3FF', fontSize: 11, marginTop: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: PHI_COLORS.card, borderRadius: 12, padding: 14 },
  menuLabel: { color: PHI_COLORS.white, flex: 1, fontSize: 15, fontWeight: '700' },
});
