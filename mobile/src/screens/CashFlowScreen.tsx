import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PaymentMethod } from '../store/cashFlowStore';
import useCashFlowStore from '../store/cashFlowStore';
import { calculateFactoringScenario, forecastCashFlow } from '../utils/rookieOwnerOperatorFinance';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS } from '../theme/cartoonTheme';

const PAYMENT_METHODS: PaymentMethod[] = ['Standard Pay', 'Quick Pay', 'Factoring'];

const numericValue = (value: string, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const dateLabel = (iso?: string): string => {
  if (!iso) return 'Not available';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function CashFlowScreen() {
  const { settings, invoices, updateSettings, addInvoice, markInvoicePaid, removeInvoice } = useCashFlowStore();
  const [startingCash, setStartingCash] = useState(String(settings.startingCash));
  const [fuelReserve, setFuelReserve] = useState(String(settings.fuelReserve));
  const [maintenanceReserve, setMaintenanceReserve] = useState(String(settings.maintenanceReserve));
  const [brokerName, setBrokerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Standard Pay');
  const [feePercent, setFeePercent] = useState('0');
  const [paymentDays, setPaymentDays] = useState('30');

  const forecast = useMemo(() => forecastCashFlow({
    startingCash: settings.startingCash,
    fuelReserve: settings.fuelReserve,
    maintenanceReserve: settings.maintenanceReserve,
    expectedInvoices: invoices.map((invoice) => ({
      amount: invoice.amount * (1 - invoice.feePercent / 100),
      expectedPaymentOn: invoice.expectedPaymentOn,
      status: invoice.status,
    })),
  }), [invoices, settings]);

  const factoringPreview = useMemo(() => {
    const invoiceAmount = numericValue(amount);
    if (invoiceAmount <= 0) return null;
    try {
      return calculateFactoringScenario({
        invoiceAmount,
        factoringFeePercent: numericValue(feePercent),
        advancePercent: 95,
        standardPaymentDays: Math.max(1, numericValue(paymentDays, 30)),
      });
    } catch {
      return null;
    }
  }, [amount, feePercent, paymentDays]);

  const saveReserves = () => {
    const next = {
      startingCash: numericValue(startingCash),
      fuelReserve: numericValue(fuelReserve),
      maintenanceReserve: numericValue(maintenanceReserve),
    };
    updateSettings(next);
    setStartingCash(String(next.startingCash));
    setFuelReserve(String(next.fuelReserve));
    setMaintenanceReserve(String(next.maintenanceReserve));
  };

  const selectMethod = (nextMethod: PaymentMethod) => {
    setMethod(nextMethod);
    if (nextMethod === 'Standard Pay') { setFeePercent('0'); setPaymentDays('30'); }
    if (nextMethod === 'Quick Pay') { setFeePercent('3'); setPaymentDays('2'); }
    if (nextMethod === 'Factoring') { setFeePercent('3'); setPaymentDays('1'); }
  };

  const submitInvoice = () => {
    const invoiceAmount = numericValue(amount);
    const days = numericValue(paymentDays);
    const fee = numericValue(feePercent);
    if (!brokerName.trim() || !invoiceNumber.trim() || invoiceAmount <= 0 || days < 1 || fee > 100) {
      Alert.alert('Review invoice details', 'Add a broker, invoice number, positive amount, payment days, and a fee between 0% and 100%.');
      return;
    }
    addInvoice({ brokerName, invoiceNumber, amount: invoiceAmount, paymentMethod: method, feePercent: fee, standardPaymentDays: days });
    setBrokerName('');
    setInvoiceNumber('');
    setAmount('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={CARTOON_COLORS.gradientRoyal} style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="wallet-outline" size={30} color="#B76010" /></View>
          <Text style={styles.eyebrow}>OWNER-OPERATOR CASH CONTROL</Text>
          <Text style={styles.heroTitle}>Cash Flow & Factoring</Text>
          <Text style={styles.heroSubtitle}>See what is available now, what is still owed, and the cost of getting paid faster.</Text>
        </LinearGradient>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={21} color="#765900" />
          <Text style={styles.noticeText}>This planning tool does not verify a broker, a factoring company, payment terms, or tax treatment. Review your written agreement and consult a qualified professional for decisions specific to your business.</Text>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard label="AVAILABLE AFTER RESERVES" value={`$${forecast.projectedCashAfterReserves.toLocaleString()}`} color={forecast.projectedCashAfterReserves >= 0 ? CARTOON_COLORS.moneyGreen : '#D64545'} />
          <SummaryCard label="PENDING NET RECEIVABLES" value={`$${forecast.pendingInvoiceAmount.toLocaleString()}`} color={CARTOON_COLORS.royalBlue} />
          <SummaryCard label="PROTECTED RESERVES" value={`$${forecast.reservedAmount.toLocaleString()}`} color={CARTOON_COLORS.electricPurple} />
          <SummaryCard label="NEXT EXPECTED PAYMENT" value={dateLabel(forecast.earliestExpectedPaymentOn)} color={CARTOON_COLORS.tangerine} small />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Operating reserve plan</Text>
          <Text style={styles.cardHelp}>Separate cash for current operating needs before treating revenue as take-home money.</Text>
          <View style={styles.inputRow}>
            <MoneyInput label="Starting cash" value={startingCash} onChangeText={setStartingCash} />
            <MoneyInput label="Fuel reserve" value={fuelReserve} onChangeText={setFuelReserve} />
            <MoneyInput label="Maintenance reserve" value={maintenanceReserve} onChangeText={setMaintenanceReserve} />
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={saveReserves}><Text style={styles.saveButtonText}>Save reserve plan</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add an invoice to the aging tracker</Text>
          <Text style={styles.cardHelp}>Log each invoice after delivery so you can see expected cash timing and disclosed payment fees.</Text>
          <TextInput style={styles.textInput} value={brokerName} onChangeText={setBrokerName} placeholder="Broker or shipper name" placeholderTextColor="#8291A8" />
          <View style={styles.invoiceInputRow}>
            <TextInput style={[styles.textInput, styles.halfInput]} value={invoiceNumber} onChangeText={setInvoiceNumber} placeholder="Invoice #" placeholderTextColor="#8291A8" />
            <TextInput style={[styles.textInput, styles.halfInput]} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Gross amount $" placeholderTextColor="#8291A8" />
          </View>
          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map((candidate) => <TouchableOpacity key={candidate} onPress={() => selectMethod(candidate)} style={[styles.methodChip, method === candidate && styles.methodChipActive]}><Text style={[styles.methodText, method === candidate && styles.methodTextActive]}>{candidate}</Text></TouchableOpacity>)}
          </View>
          <View style={styles.invoiceInputRow}>
            <MoneyInput label="Fee %" value={feePercent} onChangeText={setFeePercent} />
            <MoneyInput label="Expected days" value={paymentDays} onChangeText={setPaymentDays} />
          </View>
          {factoringPreview && method === 'Factoring' && (
            <View style={styles.factoringPreview}>
              <View style={styles.factoringPreviewHeader}><Ionicons name="flash-outline" size={19} color="#A36A00" /><Text style={styles.factoringPreviewTitle}>Factoring scenario (95% advance assumption)</Text></View>
              <Text style={styles.factoringPreviewText}>Immediate advance: ${factoringPreview.immediateAdvance.toLocaleString()} · Estimated fee: ${factoringPreview.factoringFee.toLocaleString()} · Net after fee: ${factoringPreview.netAfterFactoring.toLocaleString()} · Reserve later: ${factoringPreview.reserveReleasedLater.toLocaleString()}</Text>
            </View>
          )}
          {method === 'Quick Pay' && factoringPreview && <Text style={styles.quickPayNote}>Quick-pay scenario: a {factoringPreview.effectiveFeePercent}% fee would reduce this ${factoringPreview.invoiceAmount.toLocaleString()} invoice by ${factoringPreview.factoringFee.toLocaleString()}.</Text>}
          <TouchableOpacity style={styles.addInvoiceButton} onPress={submitInvoice}><Ionicons name="add-circle-outline" size={18} color="#FFFFFF" /><Text style={styles.addInvoiceText}>Add invoice</Text></TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>INVOICE AGING</Text><Text style={styles.invoiceCount}>{invoices.length} tracked</Text></View>
        {invoices.length === 0 ? (
          <View style={styles.emptyCard}><Ionicons name="receipt-outline" size={30} color={CARTOON_COLORS.electricBlue} /><Text style={styles.emptyTitle}>No invoices tracked yet</Text><Text style={styles.emptyText}>Add a delivered load invoice to model the payment gap before your next fuel or maintenance bill.</Text></View>
        ) : invoices.map((invoice) => {
          const net = invoice.amount * (1 - invoice.feePercent / 100);
          return <View key={invoice.id} style={styles.invoiceCard}>
            <View style={styles.invoiceTop}><View><Text style={styles.invoiceBroker}>{invoice.brokerName}</Text><Text style={styles.invoiceMeta}>{invoice.invoiceNumber} · {invoice.paymentMethod}</Text></View><View style={[styles.statusPill, invoice.status === 'paid' && styles.paidPill]}><Text style={[styles.statusText, invoice.status === 'paid' && styles.paidText]}>{invoice.status === 'paid' ? 'PAID' : 'PENDING'}</Text></View></View>
            <View style={styles.invoiceMetrics}><MiniMetric label="GROSS" value={`$${invoice.amount.toLocaleString()}`} /><MiniMetric label="FEE" value={`${invoice.feePercent}%`} /><MiniMetric label="EXPECTED NET" value={`$${net.toFixed(2)}`} /><MiniMetric label="EXPECTED" value={dateLabel(invoice.expectedPaymentOn)} /></View>
            <View style={styles.invoiceActions}>{invoice.status === 'pending' && <TouchableOpacity onPress={() => markInvoicePaid(invoice.id)} style={styles.paidButton}><Ionicons name="checkmark-circle-outline" size={17} color="#287B42" /><Text style={styles.paidButtonText}>Mark paid</Text></TouchableOpacity>}<TouchableOpacity onPress={() => removeInvoice(invoice.id)} style={styles.deleteButton}><Ionicons name="trash-outline" size={17} color="#B34A4A" /><Text style={styles.deleteButtonText}>Delete</Text></TouchableOpacity></View>
          </View>;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, color, small }: { label: string; value: string; color: string; small?: boolean }) {
  return <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, { color }, small && styles.summaryValueSmall]} numberOfLines={1}>{value}</Text></View>;
}

function MoneyInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return <View style={styles.moneyInputGroup}><Text style={styles.inputLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" style={styles.textInput} placeholder="$0" placeholderTextColor="#8291A8" /></View>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <View style={styles.miniMetric}><Text style={styles.miniLabel}>{label}</Text><Text style={styles.miniValue} numberOfLines={1}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { padding: 16, paddingBottom: 36, gap: 15 },
  hero: { borderRadius: CARTOON_RADIUS.xl, padding: 22, ...CARTOON_SHADOWS.lg },
  heroIcon: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', padding: 10, borderRadius: 18, marginBottom: 12 },
  eyebrow: { color: 'rgba(255,255,255,0.86)', fontSize: 11, letterSpacing: 1.1, fontWeight: '900' },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', lineHeight: 33, marginTop: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '600', lineHeight: 20, marginTop: 7 },
  notice: { flexDirection: 'row', gap: 9, backgroundColor: '#FFF6D7', borderWidth: 1, borderColor: '#F2D77C', borderRadius: CARTOON_RADIUS.md, padding: 13 },
  noticeText: { flex: 1, color: '#735A08', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { width: '47.5%', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D2E0F2', borderRadius: CARTOON_RADIUS.md, padding: 13, gap: 5, ...CARTOON_SHADOWS.sm },
  summaryLabel: { color: '#6A819E', fontSize: 9, lineHeight: 12, letterSpacing: 0.45, fontWeight: '900' },
  summaryValue: { fontSize: 19, fontWeight: '900' },
  summaryValueSmall: { fontSize: 13 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C9DDF7', borderRadius: CARTOON_RADIUS.lg, padding: 16, gap: 10, ...CARTOON_SHADOWS.sm },
  cardTitle: { color: CARTOON_COLORS.charcoal, fontSize: 18, fontWeight: '900' },
  cardHelp: { color: CARTOON_COLORS.slate, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 8 },
  moneyInputGroup: { flex: 1, gap: 5 },
  inputLabel: { color: '#496383', fontSize: 10, lineHeight: 13, fontWeight: '800' },
  textInput: { color: CARTOON_COLORS.charcoal, fontSize: 13, fontWeight: '800', borderWidth: 1.3, borderColor: '#C7D9F1', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#F8FBFF' },
  saveButton: { alignItems: 'center', paddingVertical: 11, borderRadius: 12, backgroundColor: CARTOON_COLORS.royalBlue },
  saveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  invoiceInputRow: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodChip: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 99, borderWidth: 1.3, borderColor: '#BFD3EE', backgroundColor: '#FFFFFF' },
  methodChipActive: { backgroundColor: CARTOON_COLORS.royalBlue, borderColor: CARTOON_COLORS.royalBlue },
  methodText: { color: '#456485', fontSize: 11, fontWeight: '900' },
  methodTextActive: { color: '#FFFFFF' },
  factoringPreview: { padding: 11, gap: 5, borderRadius: 12, backgroundColor: '#FFF6D7', borderWidth: 1, borderColor: '#F2D77C' },
  factoringPreviewHeader: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  factoringPreviewTitle: { color: '#765900', fontSize: 12, fontWeight: '900' },
  factoringPreviewText: { color: '#765900', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  quickPayNote: { color: '#765900', fontSize: 12, lineHeight: 18, fontWeight: '700', backgroundColor: '#FFF9E7', padding: 10, borderRadius: 10 },
  addInvoiceButton: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: CARTOON_COLORS.moneyGreen, paddingVertical: 12, borderRadius: 12 },
  addInvoiceText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { color: '#496383', fontSize: 11, letterSpacing: 1, fontWeight: '900' },
  invoiceCount: { color: CARTOON_COLORS.royalBlue, fontSize: 12, fontWeight: '900' },
  emptyCard: { alignItems: 'center', gap: 8, padding: 26, borderRadius: CARTOON_RADIUS.lg, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#C9DDF7' },
  emptyTitle: { color: CARTOON_COLORS.charcoal, fontSize: 16, fontWeight: '900' },
  emptyText: { color: CARTOON_COLORS.slate, fontSize: 13, lineHeight: 19, textAlign: 'center', fontWeight: '600' },
  invoiceCard: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D2E0F2', borderRadius: CARTOON_RADIUS.lg, padding: 15, gap: 11, ...CARTOON_SHADOWS.sm },
  invoiceTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  invoiceBroker: { color: CARTOON_COLORS.charcoal, fontSize: 16, fontWeight: '900' },
  invoiceMeta: { color: CARTOON_COLORS.slate, fontSize: 12, marginTop: 3, fontWeight: '700' },
  statusPill: { alignSelf: 'flex-start', backgroundColor: '#FFF4D9', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 99 },
  paidPill: { backgroundColor: '#E5F8EA' },
  statusText: { color: '#A36A00', fontSize: 10, letterSpacing: 0.5, fontWeight: '900' },
  paidText: { color: '#287B42' },
  invoiceMetrics: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#E1EBF8', borderRadius: 12, overflow: 'hidden' },
  miniMetric: { width: '50%', padding: 9, gap: 3, borderBottomWidth: 1, borderBottomColor: '#E8F0FA' },
  miniLabel: { color: '#6A819E', fontSize: 9, letterSpacing: 0.4, fontWeight: '900' },
  miniValue: { color: CARTOON_COLORS.charcoal, fontSize: 13, fontWeight: '900' },
  invoiceActions: { flexDirection: 'row', gap: 14 },
  paidButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  paidButtonText: { color: '#287B42', fontSize: 12, fontWeight: '900' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deleteButtonText: { color: '#B34A4A', fontSize: 12, fontWeight: '900' },
});
