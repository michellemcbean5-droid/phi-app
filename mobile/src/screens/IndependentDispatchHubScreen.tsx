import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DISPATCH_VERIFICATION_ITEMS } from '../store/dispatchStore';
import useDispatchStore from '../store/dispatchStore';
import { calculateDispatchMetrics } from '../utils/rookieOwnerOperatorFinance';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS } from '../theme/cartoonTheme';

const numericValue = (value: string, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export default function IndependentDispatchHubScreen() {
  const { preferences, plans, updatePreferences, removePlan, toggleVerification } = useDispatchStore();
  const [minRpm, setMinRpm] = useState(String(preferences.minimumAllInRpm));
  const [maxDeadhead, setMaxDeadhead] = useState(String(preferences.maximumDeadheadPercent));
  const [fuelCost, setFuelCost] = useState(String(preferences.fuelCostPerMile));

  const metricsByPlan = useMemo(() => new Map(plans.map((plan) => {
    const loadedMiles = Math.max(1, plan.load.miles);
    const deadheadMiles = Math.max(0, plan.load.totalMiles - loadedMiles);
    return [plan.id, calculateDispatchMetrics({
      rate: plan.load.rate,
      loadedMiles,
      deadheadMiles,
      fuelCostPerMile: preferences.fuelCostPerMile,
      minimumAllInRpm: preferences.minimumAllInRpm,
      maximumDeadheadPercent: preferences.maximumDeadheadPercent,
    })];
  })), [plans, preferences]);

  const savePreferences = () => {
    const next = {
      minimumAllInRpm: numericValue(minRpm, preferences.minimumAllInRpm),
      maximumDeadheadPercent: numericValue(maxDeadhead, preferences.maximumDeadheadPercent),
      fuelCostPerMile: numericValue(fuelCost, preferences.fuelCostPerMile),
    };
    if (next.minimumAllInRpm <= 0 || next.maximumDeadheadPercent > 100 || next.fuelCostPerMile <= 0) {
      Alert.alert('Review your targets', 'Enter a positive RPM and fuel cost, and a deadhead limit between 0% and 100%.');
      return;
    }
    updatePreferences(next);
    setMinRpm(String(next.minimumAllInRpm));
    setMaxDeadhead(String(next.maximumDeadheadPercent));
    setFuelCost(String(next.fuelCostPerMile));
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={CARTOON_COLORS.gradientForest} style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="navigate-outline" size={30} color="#16846A" /></View>
          <Text style={styles.eyebrow}>SELF-DISPATCH WORKSPACE</Text>
          <Text style={styles.heroTitle}>Independent Dispatch Hub</Text>
          <Text style={styles.heroSubtitle}>Evaluate the full trip, protect your margin, and verify terms before you book.</Text>
        </LinearGradient>

        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={21} color="#276C3F" />
          <Text style={styles.noticeText}>PHI estimates help you compare opportunities. Verify broker authority, rate confirmation, pickup details, equipment, and payment terms independently before accepting freight.</Text>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Your decision targets</Text>
          <Text style={styles.cardHelp}>These targets apply to every saved load plan on this device.</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Minimum all-in RPM</Text><TextInput value={minRpm} onChangeText={setMinRpm} keyboardType="decimal-pad" style={styles.input} placeholder="$2.25" placeholderTextColor="#8AA0BB" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Max deadhead %</Text><TextInput value={maxDeadhead} onChangeText={setMaxDeadhead} keyboardType="decimal-pad" style={styles.input} placeholder="20" placeholderTextColor="#8AA0BB" /></View>
            <View style={styles.inputGroup}><Text style={styles.inputLabel}>Fuel $ / mile</Text><TextInput value={fuelCost} onChangeText={setFuelCost} keyboardType="decimal-pad" style={styles.input} placeholder="$0.62" placeholderTextColor="#8AA0BB" /></View>
          </View>
          <TouchableOpacity style={styles.saveTargetsButton} onPress={savePreferences}><Text style={styles.saveTargetsText}>Save targets</Text></TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>SAVED LOAD PLANS</Text>
          <View style={styles.countBadge}><Text style={styles.countText}>{plans.length}</Text></View>
        </View>

        {plans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="bookmark-outline" size={32} color={CARTOON_COLORS.electricBlue} />
            <Text style={styles.emptyTitle}>No load plans saved</Text>
            <Text style={styles.emptyText}>Open the Loads tab and tap “Plan in Hub” on a potential load to compare full-trip RPM, fuel exposure, and verification steps here.</Text>
          </View>
        ) : plans.map((plan) => {
          const metrics = metricsByPlan.get(plan.id);
          if (!metrics) return null;
          const completedChecks = Object.values(plan.verification).filter(Boolean).length;
          const allVerified = completedChecks === DISPATCH_VERIFICATION_ITEMS.length;
          const statusColor = metrics.reviewStatus === 'Strong fit'
            ? CARTOON_COLORS.success
            : metrics.reviewStatus === 'Below target'
              ? '#D64545'
              : '#D88A00';
          return (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <View style={styles.planHeading}><Text style={styles.loadId}>{plan.load.id}</Text><Text style={styles.route}>{plan.load.origin.city}, {plan.load.origin.state} → {plan.load.destination.city}, {plan.load.destination.state}</Text></View>
                <TouchableOpacity onPress={() => removePlan(plan.id)} style={styles.removeButton} accessibilityLabel={`Remove load ${plan.load.id} from Dispatch Hub`}><Ionicons name="trash-outline" size={19} color="#D64545" /></TouchableOpacity>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${statusColor}20`, borderColor: statusColor }]}><View style={[styles.statusDot, { backgroundColor: statusColor }]} /><Text style={[styles.statusText, { color: statusColor }]}>{metrics.reviewStatus}</Text></View>

              <View style={styles.metricGrid}>
                <Metric label="LOAD RATE" value={`$${plan.load.rate.toLocaleString()}`} />
                <Metric label="LOADED RPM" value={`$${metrics.loadedRpm.toFixed(2)}`} />
                <Metric label="ALL-IN RPM" value={`$${metrics.allInRpm.toFixed(2)}`} emphasis={metrics.meetsMinimumAllInRpm} />
                <Metric label="DEADHEAD" value={`${metrics.deadheadPercent}%`} emphasis={metrics.withinDeadheadLimit} />
                <Metric label="FUEL ESTIMATE" value={`$${metrics.estimatedFuelCost.toLocaleString()}`} />
                <Metric label="AFTER FUEL" value={`$${metrics.estimatedContribution.toLocaleString()}`} />
              </View>

              <View style={styles.alertRow}>
                <Ionicons name={metrics.meetsMinimumAllInRpm && metrics.withinDeadheadLimit ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={19} color={statusColor} />
                <Text style={styles.alertText}>{metrics.meetsMinimumAllInRpm ? 'All-in RPM meets your target.' : `All-in RPM is below your $${preferences.minimumAllInRpm.toFixed(2)} target.`} {!metrics.withinDeadheadLimit && `Deadhead exceeds your ${preferences.maximumDeadheadPercent}% limit.`}</Text>
              </View>

              <View style={styles.verificationHeader}><Text style={styles.verificationTitle}>Pre-booking verification</Text><Text style={[styles.verificationCount, allVerified && styles.verificationCountComplete]}>{completedChecks}/{DISPATCH_VERIFICATION_ITEMS.length}</Text></View>
              {DISPATCH_VERIFICATION_ITEMS.map((item) => {
                const done = plan.verification[item.key];
                return (
                  <TouchableOpacity key={item.key} style={styles.checkRow} onPress={() => toggleVerification(plan.id, item.key)} accessibilityRole="checkbox" accessibilityState={{ checked: done }}>
                    <View style={[styles.checkIcon, done && styles.checkIconDone]}><Ionicons name={done ? 'checkmark' : 'ellipse-outline'} size={18} color={done ? '#FFFFFF' : '#8099B8'} /></View>
                    <View style={styles.checkTextWrap}><Text style={[styles.checkTitle, done && styles.checkTitleDone]}>{item.label}</Text><Text style={styles.checkDescription}>{item.description}</Text></View>
                  </TouchableOpacity>
                );
              })}
              {!allVerified && <Text style={styles.blockingText}>Finish these checks before you treat this plan as ready to book.</Text>}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, emphasis === false && styles.metricValueRisk, emphasis === true && styles.metricValueGood]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { padding: 16, paddingBottom: 36, gap: 15 },
  hero: { borderRadius: CARTOON_RADIUS.xl, padding: 22, ...CARTOON_SHADOWS.lg },
  heroIcon: { alignSelf: 'flex-start', padding: 10, borderRadius: 18, backgroundColor: '#FFFFFF', marginBottom: 12 },
  eyebrow: { color: 'rgba(255,255,255,0.86)', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', lineHeight: 33, marginTop: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 7 },
  notice: { flexDirection: 'row', gap: 9, backgroundColor: '#EAF8EF', borderWidth: 1, borderColor: '#BEE4C9', borderRadius: CARTOON_RADIUS.md, padding: 13 },
  noticeText: { flex: 1, color: '#2E6941', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  settingsCard: { backgroundColor: '#FFFFFF', padding: 16, gap: 10, borderRadius: CARTOON_RADIUS.lg, borderWidth: 1.5, borderColor: '#C9DDF7', ...CARTOON_SHADOWS.sm },
  cardTitle: { color: CARTOON_COLORS.charcoal, fontSize: 18, fontWeight: '900' },
  cardHelp: { color: CARTOON_COLORS.slate, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 8 },
  inputGroup: { flex: 1, gap: 5 },
  inputLabel: { color: '#496383', fontSize: 10, lineHeight: 13, fontWeight: '800' },
  input: { borderWidth: 1.3, borderColor: '#C7D9F1', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 8, color: CARTOON_COLORS.charcoal, fontSize: 13, fontWeight: '800', backgroundColor: '#F8FBFF' },
  saveTargetsButton: { alignItems: 'center', borderRadius: 12, paddingVertical: 11, backgroundColor: CARTOON_COLORS.royalBlue },
  saveTargetsText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  sectionLabel: { color: '#496383', fontSize: 11, letterSpacing: 1, fontWeight: '900' },
  countBadge: { minWidth: 22, height: 22, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', borderRadius: 11, backgroundColor: '#E4EFFF' },
  countText: { color: CARTOON_COLORS.royalBlue, fontSize: 12, fontWeight: '900' },
  emptyCard: { alignItems: 'center', gap: 8, padding: 26, borderRadius: CARTOON_RADIUS.lg, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C9DDF7' },
  emptyTitle: { color: CARTOON_COLORS.charcoal, fontSize: 16, fontWeight: '900' },
  emptyText: { color: CARTOON_COLORS.slate, fontSize: 13, fontWeight: '600', lineHeight: 19, textAlign: 'center' },
  planCard: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C9DDF7', padding: 16, gap: 12, borderRadius: CARTOON_RADIUS.lg, ...CARTOON_SHADOWS.sm },
  planHeader: { flexDirection: 'row', gap: 8 },
  planHeading: { flex: 1, gap: 3 },
  loadId: { color: CARTOON_COLORS.charcoal, fontSize: 18, fontWeight: '900' },
  route: { color: CARTOON_COLORS.slate, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  removeButton: { alignSelf: 'flex-start', padding: 5 },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 9, borderRadius: 99, borderWidth: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '900' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#DFEAF8', borderRadius: CARTOON_RADIUS.md, overflow: 'hidden' },
  metric: { width: '33.333%', padding: 10, gap: 3, borderBottomWidth: 1, borderBottomColor: '#E8F0FA' },
  metricLabel: { color: '#6A819E', fontSize: 9, letterSpacing: 0.4, fontWeight: '900' },
  metricValue: { color: CARTOON_COLORS.charcoal, fontSize: 14, fontWeight: '900' },
  metricValueGood: { color: '#287B42' },
  metricValueRisk: { color: '#C04343' },
  alertRow: { flexDirection: 'row', gap: 7, backgroundColor: '#F7FAFE', padding: 10, borderRadius: 12 },
  alertText: { flex: 1, color: '#496383', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  verificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  verificationTitle: { color: CARTOON_COLORS.charcoal, fontSize: 15, fontWeight: '900' },
  verificationCount: { color: '#496383', fontSize: 12, fontWeight: '900' },
  verificationCountComplete: { color: '#287B42' },
  checkRow: { flexDirection: 'row', gap: 9, paddingVertical: 7 },
  checkIcon: { width: 26, height: 26, borderWidth: 1.5, borderColor: '#A8BFDC', borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkIconDone: { backgroundColor: CARTOON_COLORS.success, borderColor: CARTOON_COLORS.success },
  checkTextWrap: { flex: 1, gap: 3 },
  checkTitle: { color: CARTOON_COLORS.charcoal, fontSize: 13, fontWeight: '800' },
  checkTitleDone: { color: '#287B42' },
  checkDescription: { color: CARTOON_COLORS.slate, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  blockingText: { color: '#A04B09', backgroundColor: '#FFF4E8', borderRadius: 10, padding: 9, fontSize: 11, lineHeight: 16, fontWeight: '800' },
});
