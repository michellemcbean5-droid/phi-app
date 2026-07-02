import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import usePromoStore from '../store/promoStore';
import useAPIKeyStore from '../store/apiKeyStore';
import AnimatedPressable from '../components/game/AnimatedPressable';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface NavRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  badge?: string;
  onPress: () => void;
}

function NavRow({ icon, label, sublabel, badge, onPress }: NavRowProps) {
  return (
    <AnimatedPressable style={styles.navRow} onPress={onPress} scaleTo={0.98}>
      <View style={styles.navIconWrap}>
        <Ionicons name={icon} size={20} color={PHI_COLORS.sunshineYellow} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.navLabel}>{label}</Text>
        {sublabel ? <Text style={styles.navSublabel}>{sublabel}</Text> : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color="#7F8FB3" />
    </AnimatedPressable>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { isTrialActive, daysRemaining, getEffectiveTier } = usePromoStore();
  const { keys } = useAPIKeyStore();

  const keysConfigured = Object.values(keys).filter(Boolean).length;
  const trialActive = isTrialActive();
  const days = daysRemaining();
  const activeTier = getEffectiveTier();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Plan Status */}
        <View style={styles.planCard}>
          <View style={styles.planRow}>
            <Ionicons name="ribbon-outline" size={22} color={PHI_COLORS.sunshineYellow} />
            <View style={{ flex: 1 }}>
              <Text style={styles.planTier}>{activeTier} Plan</Text>
              {trialActive && (
                <Text style={styles.planTrial}>Free trial — {days} days remaining</Text>
              )}
            </View>
            <TouchableOpacity style={styles.upgradePill} onPress={() => navigation.navigate('Subscription')}>
              <Text style={styles.upgradePillText}>Manage</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Dispatcher */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Dispatcher</Text>
          <NavRow
            icon="hardware-chip-outline"
            label="AI Dispatcher Settings"
            sublabel="Home base, RPM targets, auto-book"
            onPress={() => navigation.navigate('DriverPrefs')}
          />
        </View>

        {/* API & Keys */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>API Keys & Integrations</Text>
          <NavRow
            icon="key-outline"
            label="My API Keys"
            sublabel="Anthropic, DAT, ORS, EIA, Stripe"
            badge={keysConfigured > 0 ? `${keysConfigured} saved` : undefined}
            onPress={() => navigation.navigate('APIKeys')}
          />
          <NavRow
            icon="gift-outline"
            label="Promo Codes"
            sublabel="Redeem free trial or discount codes"
            onPress={() => navigation.navigate('PromoCode')}
          />
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.navLabel}>Load & Compliance Alerts</Text>
              <Text style={styles.navSublabel}>Push alerts for bookings, HOS warnings</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={notificationsEnabled ? PHI_COLORS.sunshineYellow : '#B0B0B0'}
              trackColor={{ false: '#5C6780', true: '#7EA5FF' }}
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <NavRow
            icon="card-outline"
            label="Subscription & Billing"
            sublabel="Manage your plan"
            onPress={() => navigation.navigate('Subscription')}
          />
          <NavRow
            icon="documents-outline"
            label="Documents"
            sublabel="Upload BOLs, insurance, registration"
            onPress={() => navigation.navigate('Documents')}
          />
          <NavRow
            icon="car-outline"
            label="Vehicle Profile"
            sublabel="Truck specs and ELD setup"
            onPress={() => navigation.navigate('Vehicle')}
          />
          <NavRow
            icon="car-sport-outline"
            label="Truck & Van Marketplace"
            sublabel="Buy or lease your own equipment"
            onPress={() => navigation.navigate('EquipmentMarketplace')}
          />
        </View>

        {/* Support */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Support</Text>
          <NavRow
            icon="chatbubble-ellipses-outline"
            label="Ask Michelle"
            sublabel="PHI's support assistant — policies, billing, how-to"
            onPress={() => navigation.navigate('SupportChat')}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 14 },
  planCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 18, padding: 16 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planTier: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 16 },
  planTrial: { color: PHI_COLORS.sunshineYellow, fontSize: 12, marginTop: 2 },
  upgradePill: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  upgradePillText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 12 },
  card: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 4 },
  cardTitle: { color: '#A8B7D8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E3A62' },
  navIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#132B52', alignItems: 'center', justifyContent: 'center' },
  navLabel: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 14 },
  navSublabel: { color: '#7F8FB3', fontSize: 12, marginTop: 2 },
  badge: { backgroundColor: PHI_COLORS.moneyGreen + '33', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: PHI_COLORS.moneyGreen, fontWeight: '700', fontSize: 11 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});
