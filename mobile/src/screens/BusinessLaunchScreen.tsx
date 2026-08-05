/**
 * BusinessLaunchScreen — "Start Your Trucking Business" guided checklist
 *
 * Covers all steps to go from zero to operating as an independent trucker:
 *   Phase 1 — Legal (LLC / EIN)
 *   Phase 2 — Authority (USDOT / MC Number)
 *   Phase 3 — Insurance
 *   Phase 4 — Compliance (IRP / IFTA / UCR / BOC-3)
 *   Phase 5 — Banking & Factoring
 *   Phase 6 — Equipment & ELD
 */

import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PHI_COLORS } from '../assets/brandColors';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS } from '../theme/cartoonTheme';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  cost: string;
  link?: string;
  urgent?: boolean;
}

interface ChecklistPhase {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  gradient: readonly [string, string, ...string[]];
  items: ChecklistItem[];
}

const PHASES: ChecklistPhase[] = [
  {
    id: 'legal',
    icon: '⚖️',
    title: 'Phase 1 — Legal Entity',
    subtitle: 'Protect yourself and separate personal/business liability',
    gradient: ['#1A237E', '#283593'],
    items: [
      {
        id: 'biz-name',
        title: 'Choose a Business Name',
        description: 'e.g., "Smith Hauling LLC". Check availability on your state\'s Secretary of State website.',
        cost: 'Free',
      },
      {
        id: 'llc',
        title: 'File LLC Articles of Organization',
        description: 'File with your state\'s Secretary of State. Protects personal assets from business liabilities.',
        cost: '$50–$500 depending on state',
        link: 'https://www.sos.state.tx.us',
      },
      {
        id: 'ein',
        title: 'Get Federal EIN (Tax ID)',
        description: 'Apply at IRS.gov — free and instant. Required to open a business bank account.',
        cost: 'Free',
        link: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online',
        urgent: true,
      },
      {
        id: 'bank',
        title: 'Open Business Bank Account',
        description: 'Keep business money separate from personal. Use Relay, Mercury, or any bank with no monthly fees.',
        cost: 'Free (most accounts)',
      },
    ],
  },
  {
    id: 'authority',
    icon: '🏛️',
    title: 'Phase 2 — Carrier Authority',
    subtitle: 'Required by federal law to haul freight for hire',
    gradient: ['#4A148C', '#6A1B9A'],
    items: [
      {
        id: 'usdot',
        title: 'Get USDOT Number',
        description: 'Register with FMCSA. Free and required for all commercial motor vehicles in interstate commerce.',
        cost: 'Free',
        link: 'https://www.fmcsa.dot.gov/registration/get-usdot-number',
        urgent: true,
      },
      {
        id: 'mc',
        title: 'Apply for MC Authority (Motor Carrier)',
        description: 'Allows you to haul freight for hire across state lines. Takes 20–25 business days.',
        cost: '$300 (one-time FMCSA filing fee)',
        link: 'https://www.fmcsa.dot.gov/registration/operating-authority',
        urgent: true,
      },
      {
        id: 'boc3',
        title: 'File BOC-3 (Process Agent)',
        description: 'Designates an agent in each state who can accept legal papers on your behalf. Required before MC activates.',
        cost: '$20–$40 via a blanket agent service',
      },
      {
        id: 'protest',
        title: 'Wait Out the 21-Day Protest Period',
        description: 'After MC application, you must wait 21 days before authority is activated. Plan ahead!',
        cost: 'Free (just time)',
      },
    ],
  },
  {
    id: 'insurance',
    icon: '🛡️',
    title: 'Phase 3 — Insurance',
    subtitle: 'Required before your MC authority activates',
    gradient: ['#1B5E20', '#2E7D32'],
    items: [
      {
        id: 'liability',
        title: 'Primary Liability Insurance ($750K minimum)',
        description: 'Required by FMCSA. Covers damage to other vehicles/property you cause. Get quotes from Progressive, Great West, or Owner Operator Direct.',
        cost: '$800–$2,000/month',
        urgent: true,
      },
      {
        id: 'cargo',
        title: 'Motor Truck Cargo Insurance',
        description: 'Covers the freight you\'re hauling. Most brokers require $100K coverage.',
        cost: '$150–$400/month',
      },
      {
        id: 'physical',
        title: 'Physical Damage Coverage (Optional)',
        description: 'Covers your truck if you\'re in an accident. Required if you have a loan/lease on the truck.',
        cost: 'Varies by truck value',
      },
      {
        id: 'bobtail',
        title: 'Non-Trucking / Bobtail Liability',
        description: 'Covers you when driving your truck for personal use (not under dispatch).',
        cost: '$30–$60/month',
      },
    ],
  },
  {
    id: 'compliance',
    icon: '📋',
    title: 'Phase 4 — Compliance Registrations',
    subtitle: 'Annual requirements to stay legal and avoid fines',
    gradient: ['#E65100', '#EF6C00'],
    items: [
      {
        id: 'ucr',
        title: 'UCR — Unified Carrier Registration',
        description: 'Annual registration fee based on fleet size. Due by December 31 each year.',
        cost: '$59–$90/year (1 truck)',
        link: 'https://www.ucr.gov',
        urgent: true,
      },
      {
        id: 'irp',
        title: 'IRP — Apportioned License Plates',
        description: 'Get apportioned (interstate) plates from your state\'s DMV motor carrier division.',
        cost: '$1,500–$2,500/year',
      },
      {
        id: 'ifta',
        title: 'IFTA — International Fuel Tax Agreement',
        description: 'Required for fuel tax reporting across state lines. Register with your state DOT. Report quarterly.',
        cost: 'Free to register; quarterly fuel tax filings required',
      },
      {
        id: 'eld',
        title: 'ELD — Electronic Logging Device',
        description: 'Federally required for all drivers subject to HOS rules. Use KeepTruckin (Motive), Samsara, or similar.',
        cost: '$35–$60/month',
      },
    ],
  },
  {
    id: 'banking',
    icon: '💰',
    title: 'Phase 5 — Banking & Factoring',
    subtitle: 'Get paid fast and manage cash flow like a pro',
    gradient: ['#880E4F', '#AD1457'],
    items: [
      {
        id: 'factoring',
        title: 'Set Up Freight Factoring',
        description: 'Instead of waiting 30–90 days for broker payment, factoring companies advance 90–97% of invoice value same day. RTS, OTR Capital, Triumph, or eCapital are popular options.',
        cost: '2–5% factoring fee per invoice',
      },
      {
        id: 'fuel-card',
        title: 'Get a Truck Fuel Card',
        description: 'EFS, Comdata, or Love\'s Fuel Card give you discounts at truck stops nationwide. Can save $0.10–$0.40/gallon.',
        cost: 'Free (discounts save money)',
      },
      {
        id: 'accounting',
        title: 'Set Up Accounting / Tax Tracking',
        description: 'Use QuickBooks Self-Employed or TruckingOffice. Track miles, fuel, tolls, and expenses for quarterly estimated taxes.',
        cost: '$15–$30/month',
      },
      {
        id: 'quarterly-tax',
        title: 'Pay Quarterly Estimated Taxes',
        description: 'As a self-employed trucking owner, you pay taxes quarterly (Jan, Apr, Jun, Sep). Budget 25–30% of net profit.',
        cost: 'Ongoing (~25–30% of net)',
      },
    ],
  },
  {
    id: 'equipment',
    icon: '🚛',
    title: 'Phase 6 — Equipment & Operations',
    subtitle: 'Get rolling and start hauling',
    gradient: ['#006064', '#00838F'],
    items: [
      {
        id: 'truck',
        title: 'Purchase or Lease Your Truck',
        description: 'Owner-operators typically start with a 2015–2020 model year semi. Budget $40K–$100K (purchase) or $1,200–$2,000/month (lease-to-own).',
        cost: '$40K–$100K or $1,200–$2,000/month',
      },
      {
        id: 'trailer',
        title: 'Trailer (Own, Lease, or Drop & Hook)',
        description: 'Dry van 53-foot trailers run $15K–$40K used. Or start with rented trailers / broker drop trailers.',
        cost: '$15K–$40K (own) or ~$500/month (lease)',
      },
      {
        id: 'load-board',
        title: 'Subscribe to Load Boards',
        description: 'DAT ($50/month), Truckstop.com ($60/month), or use PHI\'s built-in load aggregator which pulls from 5 sources!',
        cost: '$50–$120/month (or free with PHI)',
        urgent: true,
      },
      {
        id: 'phi-app',
        title: '🤖 Activate Your PHI AI Workers',
        description: 'With PHI set up, your 10 AI workers handle dispatch, compliance, invoicing, route optimization, and more — automatically.',
        cost: 'Included with PHI subscription',
        urgent: true,
      },
    ],
  },
];

export default function BusinessLaunchScreen() {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [expandedPhase, setExpandedPhase] = useState<string | null>('legal');

  const totalItems = PHASES.reduce((sum, p) => sum + p.items.length, 0);
  const completedCount = completedItems.size;
  const progressPct = Math.round((completedCount / totalItems) * 100);

  const toggleItem = (itemId: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const openLink = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() =>
      Alert.alert('Cannot Open Link', 'Please visit the URL manually.'),
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient
          colors={['#0D47A1', '#1565C0']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>🚛 Start Your Trucking Business</Text>
          <Text style={styles.headerSubtitle}>
            Follow this step-by-step guide to go from zero to operating as an independent owner-operator.
          </Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
            </View>
            <Text style={styles.progressText}>{completedCount}/{totalItems} steps completed ({progressPct}%)</Text>
          </View>
        </LinearGradient>

        {/* Cost Summary */}
        <View style={styles.costCard}>
          <Text style={styles.costTitle}>💸 Estimated Startup Costs</Text>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Minimum to start:</Text>
            <Text style={styles.costValue}>~$5,000–$8,000</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>With truck purchase:</Text>
            <Text style={styles.costValue}>~$50,000–$120,000</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Monthly operating (no truck payment):</Text>
            <Text style={styles.costValue}>~$3,500–$6,000</Text>
          </View>
          <Text style={styles.costNote}>
            💡 Average owner-operator earns $150K–$250K gross annually. After expenses, net $50K–$100K+.
          </Text>
        </View>

        {/* Phases */}
        {PHASES.map((phase) => {
          const isExpanded = expandedPhase === phase.id;
          const phaseCompleted = phase.items.filter((i) => completedItems.has(i.id)).length;
          const phaseTotal = phase.items.length;
          const allDone = phaseCompleted === phaseTotal;

          return (
            <View key={phase.id} style={styles.phaseCard}>
              <TouchableOpacity
                style={styles.phaseHeader}
                onPress={() => setExpandedPhase(isExpanded ? null : phase.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={phase.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.phaseHeaderGradient}
                >
                  <View style={styles.phaseHeaderLeft}>
                    <Text style={styles.phaseIcon}>{phase.icon}</Text>
                    <View>
                      <Text style={styles.phaseTitle}>{phase.title}</Text>
                      <Text style={styles.phaseSubtitle}>{phase.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.phaseHeaderRight}>
                    <View style={[styles.phaseBadge, allDone && styles.phaseBadgeDone]}>
                      <Text style={styles.phaseBadgeText}>{phaseCompleted}/{phaseTotal}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.itemsList}>
                  {phase.items.map((item) => {
                    const done = completedItems.has(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.item, done && styles.itemDone]}
                        onPress={() => toggleItem(item.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.itemCheckbox}>
                          <Ionicons
                            name={done ? 'checkmark-circle' : 'ellipse-outline'}
                            size={26}
                            color={done ? CARTOON_COLORS.limeGreen : '#7F9FCC'}
                          />
                        </View>
                        <View style={styles.itemContent}>
                          <View style={styles.itemTitleRow}>
                            <Text style={[styles.itemTitle, done && styles.itemTitleDone]}>
                              {item.title}
                            </Text>
                            {item.urgent && !done && (
                              <View style={styles.urgentBadge}>
                                <Text style={styles.urgentText}>REQUIRED</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.itemDesc}>{item.description}</Text>
                          <View style={styles.itemMeta}>
                            <View style={styles.costChip}>
                              <Ionicons name="cash-outline" size={12} color={PHI_COLORS.moneyGreen} />
                              <Text style={styles.costChipText}>{item.cost}</Text>
                            </View>
                            {item.link && (
                              <TouchableOpacity
                                style={styles.linkBtn}
                                onPress={() => openLink(item.link)}
                              >
                                <Ionicons name="open-outline" size={12} color={PHI_COLORS.royalBlue} />
                                <Text style={styles.linkBtnText}>Official Link</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Completion Banner */}
        {progressPct === 100 && (
          <View style={styles.completionBanner}>
            <Text style={styles.completionEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>You&apos;re Ready to Roll!</Text>
            <Text style={styles.completionText}>
              You&apos;ve completed every step. Your business is legal, insured, and ready to haul freight.
              Head to the Load Board and book your first load!
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { gap: 12, paddingBottom: 32 },
  header: { padding: 24, gap: 10 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20 },
  progressContainer: { gap: 8, marginTop: 8 },
  progressBar: { height: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 999 },
  progressText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' },
  costCard: { margin: 12, backgroundColor: '#FFFFFF', borderRadius: CARTOON_RADIUS.xl, padding: 18, gap: 8, ...CARTOON_SHADOWS.md },
  costTitle: { fontSize: 16, fontWeight: '900', color: '#1A1A2E', marginBottom: 4 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costLabel: { color: '#5C6780', fontSize: 13, flex: 1 },
  costValue: { color: '#1A1A2E', fontSize: 14, fontWeight: '800' },
  costNote: { color: '#2E7D32', fontSize: 12, lineHeight: 18, marginTop: 4, fontWeight: '600' },
  phaseCard: { marginHorizontal: 12, borderRadius: CARTOON_RADIUS.xl, overflow: 'hidden', ...CARTOON_SHADOWS.md },
  phaseHeader: { borderRadius: CARTOON_RADIUS.xl, overflow: 'hidden' },
  phaseHeaderGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  phaseHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  phaseIcon: { fontSize: 28 },
  phaseTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  phaseSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  phaseHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  phaseBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  phaseBadgeDone: { backgroundColor: PHI_COLORS.moneyGreen },
  phaseBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  itemsList: { backgroundColor: '#FFFFFF', gap: 0 },
  item: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FF',
    backgroundColor: '#FFFFFF',
  },
  itemDone: { backgroundColor: '#F0FFF4' },
  itemCheckbox: { paddingTop: 2 },
  itemContent: { flex: 1, gap: 6 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  itemTitle: { color: '#1A1A2E', fontSize: 14, fontWeight: '800', flex: 1 },
  itemTitleDone: { color: '#7F9FCC', textDecorationLine: 'line-through' },
  urgentBadge: { backgroundColor: '#FF5252', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  urgentText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  itemDesc: { color: '#5C6780', fontSize: 12, lineHeight: 18 },
  itemMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 2 },
  costChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FFF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  costChipText: { color: PHI_COLORS.moneyGreen, fontSize: 11, fontWeight: '700' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  linkBtnText: { color: PHI_COLORS.royalBlue, fontSize: 11, fontWeight: '700' },
  completionBanner: { margin: 12, backgroundColor: PHI_COLORS.moneyGreen, borderRadius: CARTOON_RADIUS.xl, padding: 24, alignItems: 'center', gap: 8, ...CARTOON_SHADOWS.lg },
  completionEmoji: { fontSize: 48 },
  completionTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  completionText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
