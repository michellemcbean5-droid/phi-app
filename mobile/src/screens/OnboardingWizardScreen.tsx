/**
 * OnboardingWizard — Driver business setup
 *
 * Step-by-step wizard to collect:
 *   1. Basic info (name, phone, home city/state)
 *   2. CDL details (class, number, expiry)
 *   3. Business info (MC#, DOT#)
 *   4. Equipment info (truck type, year)
 *   5. Insurance
 *   6. Done / AI business checklist
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TOTAL_STEPS = 6;

const LLC_CHECKLIST = [
  'Choose a business name (e.g., "Smith Trucking LLC")',
  'File Articles of Organization in your state ($50–$500)',
  'Obtain Federal EIN (free at IRS.gov)',
  'Open a dedicated business bank account',
  'Get USDOT Number (free at FMCSA.dot.gov)',
  'Apply for MC Authority ($300 via FMCSA)',
  'Purchase $750K+ liability insurance (required)',
  'Get UCR (Unified Carrier Registration) — annual',
  'File BOC-3 (process agent designation)',
  'Activate authority after 21-day protest period',
  'Get IRP (apportioned plates) from your state DMV',
  'Register for IFTA (fuel tax reporting)',
];

export default function OnboardingWizardScreen() {
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState(1);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cdlClass, setCdlClass] = useState('A');
  const [cdlNumber, setCdlNumber] = useState('');
  const [cdlExpiry, setCdlExpiry] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [truckType, setTruckType] = useState('Dry Van');
  const [truckYear, setTruckYear] = useState('');
  const [insuranceCarrier, setInsuranceCarrier] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');

  const progress = step / TOTAL_STEPS;

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };
  const handleFinish = () => {
    Alert.alert(
      "You're All Set! 🚛",
      "Your PHI profile is complete. Your AI agents are ready to find loads and run your business.",
      [{ text: 'Start Hauling', onPress: () => navigation.navigate('Main') }],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Step counter */}
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={handleBack} disabled={step === 1} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={step === 1 ? '#29508C' : PHI_COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.stepCounter}>Step {step} of {TOTAL_STEPS}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          {step === 1 && <Step1 name={name} setName={setName} phone={phone} setPhone={setPhone} city={city} setCity={setCity} stateName={state} setState={setState} />}
          {step === 2 && <Step2 cdlClass={cdlClass} setCdlClass={setCdlClass} cdlNumber={cdlNumber} setCdlNumber={setCdlNumber} cdlExpiry={cdlExpiry} setCdlExpiry={setCdlExpiry} />}
          {step === 3 && <Step3 mcNumber={mcNumber} setMcNumber={setMcNumber} dotNumber={dotNumber} setDotNumber={setDotNumber} />}
          {step === 4 && <Step4 truckType={truckType} setTruckType={setTruckType} truckYear={truckYear} setTruckYear={setTruckYear} />}
          {step === 5 && <Step5 insuranceCarrier={insuranceCarrier} setInsuranceCarrier={setInsuranceCarrier} policyNumber={policyNumber} setPolicyNumber={setPolicyNumber} />}
          {step === 6 && <Step6 onFinish={handleFinish} />}
        </ScrollView>
      </KeyboardAvoidingView>

      {step < TOTAL_STEPS && (
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Continue</Text>
          <Ionicons name="chevron-forward" size={18} color={PHI_COLORS.charcoalBlack} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ── Step components ───────────────────────────────────────────────────────────

function StepTitle({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <View style={stepStyles.titleBlock}>
      <Text style={stepStyles.emoji}>{emoji}</Text>
      <Text style={stepStyles.title}>{title}</Text>
      <Text style={stepStyles.sub}>{sub}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) {
  return (
    <View style={stepStyles.field}>
      <Text style={stepStyles.label}>{label}</Text>
      <TextInput
        style={stepStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7F9FCC"
        keyboardType={keyboardType}
        autoCorrect={false}
      />
    </View>
  );
}

function Step1({ name, setName, phone, setPhone, city, setCity, stateName, setState }: any) {
  return (
    <>
      <StepTitle emoji="👋" title="Welcome to PHI" sub="Tell us about yourself so we can personalize your AI team." />
      <Field label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" />
      <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="(555) 000-0000" keyboardType="phone-pad" />
      <Field label="Home City" value={city} onChangeText={setCity} placeholder="Dallas" />
      <Field label="Home State" value={stateName} onChangeText={setState} placeholder="TX" />
    </>
  );
}

function Step2({ cdlClass, setCdlClass, cdlNumber, setCdlNumber, cdlExpiry, setCdlExpiry }: any) {
  return (
    <>
      <StepTitle emoji="🪪" title="CDL Information" sub="Your license details help us match the right loads to your qualification." />
      <View style={stepStyles.field}>
        <Text style={stepStyles.label}>CDL Class</Text>
        <View style={stepStyles.segmentRow}>
          {['A', 'B', 'C'].map((cls) => (
            <TouchableOpacity
              key={cls}
              style={[stepStyles.segment, cdlClass === cls && stepStyles.segmentActive]}
              onPress={() => setCdlClass(cls)}
            >
              <Text style={[stepStyles.segmentText, cdlClass === cls && stepStyles.segmentTextActive]}>
                Class {cls}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <Field label="CDL Number" value={cdlNumber} onChangeText={setCdlNumber} placeholder="License number" />
      <Field label="Expiry Date" value={cdlExpiry} onChangeText={setCdlExpiry} placeholder="MM/YYYY" />
    </>
  );
}

function Step3({ mcNumber, setMcNumber, dotNumber, setDotNumber }: any) {
  return (
    <>
      <StepTitle emoji="🏢" title="Business Authority" sub="Your MC and DOT numbers are required to haul for profit. No numbers yet? We'll help you get them." />
      <Field label="MC Number" value={mcNumber} onChangeText={setMcNumber} placeholder="MC-123456 (leave blank if pending)" />
      <Field label="USDOT Number" value={dotNumber} onChangeText={setDotNumber} placeholder="1234567 (leave blank if pending)" />
      <View style={stepStyles.helpCard}>
        <Ionicons name="information-circle-outline" size={18} color={PHI_COLORS.sunshineYellow} />
        <Text style={stepStyles.helpText}>
          No MC/DOT yet? Check the LLC Checklist in Step 6 — your AI Business Coach will walk you through the entire setup process.
        </Text>
      </View>
    </>
  );
}

function Step4({ truckType, setTruckType, truckYear, setTruckYear }: any) {
  const types = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'Tanker'];
  return (
    <>
      <StepTitle emoji="🚛" title="Your Equipment" sub="Tell us about your truck so we filter loads that fit." />
      <View style={stepStyles.field}>
        <Text style={stepStyles.label}>Trailer Type</Text>
        <View style={stepStyles.pillRow}>
          {types.map((t) => (
            <TouchableOpacity
              key={t}
              style={[stepStyles.pill, truckType === t && stepStyles.pillActive]}
              onPress={() => setTruckType(t)}
            >
              <Text style={[stepStyles.pillText, truckType === t && stepStyles.pillTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <Field label="Truck Year" value={truckYear} onChangeText={setTruckYear} placeholder="2020" keyboardType="number-pad" />
    </>
  );
}

function Step5({ insuranceCarrier, setInsuranceCarrier, policyNumber, setPolicyNumber }: any) {
  return (
    <>
      <StepTitle emoji="🛡️" title="Insurance" sub="FMCSA requires minimum $750K liability. We'll store this securely in your document vault." />
      <Field label="Insurance Carrier" value={insuranceCarrier} onChangeText={setInsuranceCarrier} placeholder="Progressive, Great West, etc." />
      <Field label="Policy Number" value={policyNumber} onChangeText={setPolicyNumber} placeholder="Policy number" />
      <View style={stepStyles.helpCard}>
        <Ionicons name="shield-checkmark-outline" size={18} color={PHI_COLORS.moneyGreen} />
        <Text style={stepStyles.helpText}>
          PHI's insurance marketplace can help you find commercial trucking insurance starting at competitive rates.
        </Text>
      </View>
    </>
  );
}

function Step6({ onFinish }: { onFinish: () => void }) {
  return (
    <>
      <StepTitle emoji="🏆" title="You're Ready!" sub="Your AI agents are configured and ready to find freight. Here's your LLC launch checklist:" />
      {LLC_CHECKLIST.map((item, i) => (
        <View key={i} style={stepStyles.checkRow}>
          <View style={stepStyles.checkBox}>
            <Text style={stepStyles.checkNum}>{i + 1}</Text>
          </View>
          <Text style={stepStyles.checkText}>{item}</Text>
        </View>
      ))}
      <TouchableOpacity style={stepStyles.finishBtn} onPress={onFinish}>
        <Text style={stepStyles.finishBtnText}>🚛 Start Hauling with PHI</Text>
      </TouchableOpacity>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  flex: { flex: 1 },
  progressTrack: { height: 4, backgroundColor: '#0A1628' },
  progressFill: { height: 4, backgroundColor: PHI_COLORS.sunshineYellow },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepCounter: { color: '#7F9FCC', fontWeight: '700', fontSize: 13 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: PHI_COLORS.sunshineYellow,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextBtnText: { color: PHI_COLORS.charcoalBlack, fontWeight: '900', fontSize: 16 },
});

const stepStyles = StyleSheet.create({
  titleBlock: { alignItems: 'center', gap: 6, marginBottom: 10 },
  emoji: { fontSize: 48 },
  title: { color: PHI_COLORS.white, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  sub: { color: '#D7E3FF', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  field: { gap: 6 },
  label: { color: '#D7E3FF', fontWeight: '700', fontSize: 13 },
  input: {
    backgroundColor: PHI_COLORS.card,
    borderRadius: 14,
    padding: 14,
    color: PHI_COLORS.white,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#29508C',
  },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: PHI_COLORS.card,
    borderWidth: 1,
    borderColor: '#29508C',
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: PHI_COLORS.royalBlue, borderColor: PHI_COLORS.royalBlue },
  segmentText: { color: '#7F9FCC', fontWeight: '700' },
  segmentTextActive: { color: PHI_COLORS.white },
  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: PHI_COLORS.card,
    borderWidth: 1,
    borderColor: '#29508C',
  },
  pillActive: { backgroundColor: PHI_COLORS.royalBlue, borderColor: PHI_COLORS.royalBlue },
  pillText: { color: '#7F9FCC', fontWeight: '700', fontSize: 12 },
  pillTextActive: { color: PHI_COLORS.white },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#0D2A50',
    borderRadius: 14,
    padding: 14,
  },
  helpText: { color: '#D7E3FF', fontSize: 13, lineHeight: 19, flex: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: PHI_COLORS.royalBlue,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkNum: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 11 },
  checkText: { color: '#D7E3FF', fontSize: 13, lineHeight: 19, flex: 1 },
  finishBtn: {
    backgroundColor: PHI_COLORS.sunshineYellow,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  finishBtnText: { color: PHI_COLORS.charcoalBlack, fontWeight: '900', fontSize: 16 },
});
