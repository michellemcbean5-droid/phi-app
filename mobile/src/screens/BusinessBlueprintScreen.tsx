import { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BlueprintStage,
  BUSINESS_BLUEPRINT_STEPS,
} from '../store/businessBlueprintStore';
import useBusinessBlueprintStore from '../store/businessBlueprintStore';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS } from '../theme/cartoonTheme';

const STAGES: Array<BlueprintStage | 'All'> = [
  'All',
  'Readiness',
  'Business Setup',
  'Federal Registration',
  'Authority Activation',
  'Safety Foundation',
  'Launch Operations',
];

export default function BusinessBlueprintScreen() {
  const { completedStepIds, toggleStep, resetBlueprint } = useBusinessBlueprintStore();
  const [selectedStage, setSelectedStage] = useState<BlueprintStage | 'All'>('All');

  const requiredSteps = BUSINESS_BLUEPRINT_STEPS.filter((step) => step.isRequired);
  const completedRequired = requiredSteps.filter((step) => completedStepIds.includes(step.id)).length;
  const progress = Math.round((completedRequired / requiredSteps.length) * 100);
  const nextStep = requiredSteps.find((step) => !completedStepIds.includes(step.id));
  const visibleSteps = useMemo(
    () => BUSINESS_BLUEPRINT_STEPS.filter((step) => selectedStage === 'All' || step.stage === selectedStage),
    [selectedStage],
  );

  const openResource = async (url?: string) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Unable to open resource', 'Please try again from your device browser.');
      return;
    }
    await Linking.openURL(url);
  };

  const confirmReset = () => {
    Alert.alert('Reset Blueprint?', 'This will clear your completed steps on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetBlueprint },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={CARTOON_COLORS.gradientOcean} style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="map-outline" size={30} color={CARTOON_COLORS.royalBlue} />
          </View>
          <Text style={styles.eyebrow}>ROOKIE OWNER-OPERATOR</Text>
          <Text style={styles.heroTitle}>Your Business Blueprint</Text>
          <Text style={styles.heroSubtitle}>
            Move from CDL-ready to launch-ready with an organized checklist—not legal, tax, insurance, or regulatory advice.
          </Text>
          <View style={styles.progressTrack} accessibilityLabel={`${progress}% of required steps complete`}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressText}>{completedRequired} of {requiredSteps.length} core steps complete</Text>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        </LinearGradient>

        {nextStep ? (
          <View style={styles.nextCard}>
            <View style={styles.nextIcon}><Ionicons name="flag-outline" size={22} color={CARTOON_COLORS.royalBlue} /></View>
            <View style={styles.nextBody}>
              <Text style={styles.nextLabel}>NEXT BEST STEP</Text>
              <Text style={styles.nextTitle}>{nextStep.title}</Text>
              <Text style={styles.nextDescription}>{nextStep.actionLabel}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.nextCard, styles.completeCard]}>
            <Ionicons name="checkmark-circle" size={28} color={CARTOON_COLORS.success} />
            <View style={styles.nextBody}>
              <Text style={styles.nextLabel}>BLUEPRINT COMPLETE</Text>
              <Text style={styles.nextTitle}>Review each official record before accepting a load.</Text>
            </View>
          </View>
        )}

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={22} color={CARTOON_COLORS.royalBlue} />
          <Text style={styles.noticeText}>
            Requirements vary by cargo, operation, business structure, and state. Verify every filing, coverage, and authority status directly with the appropriate agency or qualified professional.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STAGES.map((stage) => {
            const active = stage === selectedStage;
            return (
              <TouchableOpacity
                key={stage}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedStage(stage)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{stage}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.stepList}>
          {visibleSteps.map((step, index) => {
            const complete = completedStepIds.includes(step.id);
            return (
              <View key={step.id} style={[styles.stepCard, complete && styles.stepCardComplete]}>
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: complete }}
                  accessibilityLabel={`Mark ${step.title} ${complete ? 'incomplete' : 'complete'}`}
                  style={[styles.check, complete && styles.checkComplete]}
                  onPress={() => toggleStep(step.id)}
                >
                  <Ionicons name={complete ? 'checkmark' : 'ellipse-outline'} size={20} color={complete ? '#FFFFFF' : '#8BA5D6'} />
                </TouchableOpacity>
                <View style={styles.stepContent}>
                  <Text style={styles.stageLabel}>{step.stage}</Text>
                  <Text style={[styles.stepTitle, complete && styles.textComplete]}>{index + 1}. {step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                  <Text style={styles.actionText}>{step.actionLabel}</Text>
                  {step.resourceUrl && (
                    <TouchableOpacity onPress={() => void openResource(step.resourceUrl)} style={styles.resourceButton} accessibilityRole="link">
                      <Ionicons name="open-outline" size={16} color={CARTOON_COLORS.royalBlue} />
                      <Text style={styles.resourceText}>{step.resourceLabel ?? 'Open official resource'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={confirmReset} accessibilityRole="button">
          <Ionicons name="refresh-outline" size={18} color="#D64545" />
          <Text style={styles.resetText}>Reset my Blueprint progress</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { padding: 16, paddingBottom: 36, gap: 16 },
  hero: { borderRadius: CARTOON_RADIUS.xl, padding: 22, ...CARTOON_SHADOWS.lg },
  heroIcon: { alignSelf: 'flex-start', borderRadius: 18, backgroundColor: '#FFFFFF', padding: 10, marginBottom: 14 },
  eyebrow: { color: 'rgba(255,255,255,0.84)', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: '#FFFFFF', fontSize: 29, lineHeight: 36, fontWeight: '900', marginTop: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 8 },
  progressTrack: { backgroundColor: 'rgba(255,255,255,0.28)', height: 12, borderRadius: 99, overflow: 'hidden', marginTop: 18 },
  progressFill: { backgroundColor: CARTOON_COLORS.sunshineYellow, height: '100%', borderRadius: 99 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  nextCard: { flexDirection: 'row', gap: 12, borderWidth: 2, borderColor: '#A8CEFF', backgroundColor: '#FFFFFF', borderRadius: CARTOON_RADIUS.lg, padding: 16, ...CARTOON_SHADOWS.sm },
  completeCard: { borderColor: '#82D99C' },
  nextIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7F1FF' },
  nextBody: { flex: 1, gap: 3 },
  nextLabel: { color: CARTOON_COLORS.royalBlue, fontSize: 11, letterSpacing: 0.8, fontWeight: '900' },
  nextTitle: { color: CARTOON_COLORS.charcoal, fontSize: 16, lineHeight: 21, fontWeight: '900' },
  nextDescription: { color: CARTOON_COLORS.slate, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  notice: { flexDirection: 'row', gap: 10, backgroundColor: '#EAF3FF', borderRadius: CARTOON_RADIUS.md, padding: 14, borderWidth: 1, borderColor: '#BDD9FF' },
  noticeText: { flex: 1, color: '#30527C', fontSize: 12, lineHeight: 18, fontWeight: '600' },
  filterRow: { gap: 8, paddingVertical: 2, paddingRight: 16 },
  filterChip: { borderRadius: CARTOON_RADIUS.pill, borderWidth: 1.5, borderColor: '#BDD0F2', backgroundColor: '#FFFFFF', paddingVertical: 9, paddingHorizontal: 13 },
  filterChipActive: { borderColor: CARTOON_COLORS.royalBlue, backgroundColor: CARTOON_COLORS.royalBlue },
  filterText: { color: '#496383', fontSize: 12, fontWeight: '800' },
  filterTextActive: { color: '#FFFFFF' },
  stepList: { gap: 12 },
  stepCard: { flexDirection: 'row', gap: 12, backgroundColor: '#FFFFFF', padding: 16, borderRadius: CARTOON_RADIUS.lg, borderWidth: 1.5, borderColor: '#D7E6FA', ...CARTOON_SHADOWS.sm },
  stepCardComplete: { backgroundColor: '#F2FFF6', borderColor: '#A9E6BA' },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#9BB8E7', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkComplete: { borderColor: CARTOON_COLORS.success, backgroundColor: CARTOON_COLORS.success },
  stepContent: { flex: 1, gap: 5 },
  stageLabel: { color: CARTOON_COLORS.royalBlue, fontSize: 10, fontWeight: '900', letterSpacing: 0.7, textTransform: 'uppercase' },
  stepTitle: { color: CARTOON_COLORS.charcoal, fontSize: 16, lineHeight: 21, fontWeight: '900' },
  textComplete: { color: '#337145' },
  stepDescription: { color: CARTOON_COLORS.slate, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  actionText: { color: '#335980', fontSize: 12, lineHeight: 18, fontWeight: '800' },
  resourceButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 3, paddingVertical: 5 },
  resourceText: { color: CARTOON_COLORS.royalBlue, fontSize: 12, fontWeight: '900' },
  resetButton: { flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'center', padding: 10 },
  resetText: { color: '#D64545', fontSize: 13, fontWeight: '800' },
});
