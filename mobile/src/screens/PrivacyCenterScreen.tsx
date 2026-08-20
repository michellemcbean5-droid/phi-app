import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LEGAL_URLS, hasConfiguredLegalUrls } from '../config/legal';
import { CARTOON_COLORS, CARTOON_RADIUS, CARTOON_SHADOWS } from '../theme/cartoonTheme';

interface DataUseRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  color: string;
}

function DataUseRow({ icon, title, body, color }: DataUseRowProps) {
  return <View style={styles.dataRow}><View style={[styles.dataIcon, { backgroundColor: `${color}20` }]}><Ionicons name={icon} size={20} color={color} /></View><View style={styles.dataBody}><Text style={styles.dataTitle}>{title}</Text><Text style={styles.dataText}>{body}</Text></View></View>;
}

export default function PrivacyCenterScreen() {
  const openLink = async (url?: string, label?: string) => {
    if (!url) {
      Alert.alert('Link not configured', `${label ?? 'This legal document'} must be hosted at a public HTTPS address before the production app is submitted to Google Play.`);
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Unable to open link', 'Please try again from your device browser.');
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="shield-checkmark-outline" size={30} color={CARTOON_COLORS.royalBlue} /></View>
          <Text style={styles.eyebrow}>YOUR DATA, EXPLAINED</Text>
          <Text style={styles.heroTitle}>Privacy Center</Text>
          <Text style={styles.heroSubtitle}>Understand what the app uses for each feature and keep control of optional device permissions.</Text>
        </View>

        <View style={[styles.releaseStatus, hasConfiguredLegalUrls() ? styles.releaseReady : styles.releaseBlocked]}>
          <Ionicons name={hasConfiguredLegalUrls() ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={22} color={hasConfiguredLegalUrls() ? '#287B42' : '#A36A00'} />
          <View style={{ flex: 1 }}><Text style={[styles.releaseStatusTitle, { color: hasConfiguredLegalUrls() ? '#287B42' : '#A36A00' }]}>{hasConfiguredLegalUrls() ? 'Legal links configured' : 'Legal links required for production'}</Text><Text style={styles.releaseStatusText}>{hasConfiguredLegalUrls() ? 'Privacy Policy and Terms links are present in this build configuration.' : 'Set public HTTPS Privacy Policy and Terms URLs before creating the production Android bundle.'}</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Feature-level data use</Text>
          <DataUseRow icon="map-outline" color={CARTOON_COLORS.royalBlue} title="Business Blueprint" body="Checklist progress is stored on this device so you can continue setup work after restarting the app." />
          <DataUseRow icon="people-outline" color={CARTOON_COLORS.bubblegumPink} title="Driver’s Circle testing preview" body="Posts, replies, reported items, and blocked names are saved on this device during testing. A live peer network requires an authenticated, moderated service before public release." />
          <DataUseRow icon="wallet-outline" color={CARTOON_COLORS.tangerine} title="Cash Flow and Dispatch Hub" body="Your invoice details, cash reserves, dispatch targets, and saved load plans are stored on this device for planning. They are not financial, credit, or payment verification." />
          <DataUseRow icon="location-outline" color={CARTOON_COLORS.moneyGreen} title="Location" body="The app requests foreground location only when you use location-based load, route, or HOS features. This release does not need continuous background location tracking." />
          <DataUseRow icon="camera-outline" color={CARTOON_COLORS.electricPurple} title="Camera" body="Camera access is requested only when you choose to scan a freight document for your Virtual Glovebox." />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your controls</Text>
          <View style={styles.controlRow}><Ionicons name="settings-outline" size={19} color={CARTOON_COLORS.royalBlue} /><Text style={styles.controlText}>You can deny or revoke camera and location permissions in your device settings. Core checklists and calculators remain available without those permissions.</Text></View>
          <View style={styles.controlRow}><Ionicons name="trash-outline" size={19} color={CARTOON_COLORS.royalBlue} /><Text style={styles.controlText}>For the internal test build, remove locally stored planning data by clearing the app’s storage from your device settings. A production account-deletion workflow must be connected before public community launch.</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal documents</Text>
          <TouchableOpacity style={styles.legalButton} onPress={() => void openLink(LEGAL_URLS.privacyPolicy, 'Privacy Policy')} accessibilityRole="link"><Ionicons name="document-text-outline" size={19} color={CARTOON_COLORS.royalBlue} /><Text style={styles.legalButtonText}>Privacy Policy</Text><Ionicons name="open-outline" size={17} color="#6A819E" /></TouchableOpacity>
          <TouchableOpacity style={styles.legalButton} onPress={() => void openLink(LEGAL_URLS.termsOfUse, 'Terms of Use')} accessibilityRole="link"><Ionicons name="reader-outline" size={19} color={CARTOON_COLORS.royalBlue} /><Text style={styles.legalButtonText}>Terms of Use</Text><Ionicons name="open-outline" size={17} color="#6A819E" /></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7FF' },
  content: { padding: 16, paddingBottom: 36, gap: 15 },
  hero: { padding: 22, borderRadius: CARTOON_RADIUS.xl, backgroundColor: '#E7F1FF', borderWidth: 2, borderColor: '#B2D0FF', ...CARTOON_SHADOWS.md },
  heroIcon: { alignSelf: 'flex-start', padding: 10, borderRadius: 18, backgroundColor: '#FFFFFF', marginBottom: 12 },
  eyebrow: { color: CARTOON_COLORS.royalBlue, fontSize: 11, letterSpacing: 1.1, fontWeight: '900' },
  heroTitle: { color: CARTOON_COLORS.charcoal, fontSize: 28, fontWeight: '900', marginTop: 5 },
  heroSubtitle: { color: CARTOON_COLORS.slate, fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: 7 },
  releaseStatus: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: CARTOON_RADIUS.md, borderWidth: 1 },
  releaseReady: { backgroundColor: '#EAF8EF', borderColor: '#BEE4C9' },
  releaseBlocked: { backgroundColor: '#FFF6D7', borderColor: '#F2D77C' },
  releaseStatusTitle: { fontSize: 14, fontWeight: '900' },
  releaseStatusText: { color: CARTOON_COLORS.slate, fontSize: 12, lineHeight: 18, marginTop: 3, fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', padding: 16, gap: 12, borderWidth: 1.5, borderColor: '#C9DDF7', borderRadius: CARTOON_RADIUS.lg, ...CARTOON_SHADOWS.sm },
  cardTitle: { color: CARTOON_COLORS.charcoal, fontSize: 17, fontWeight: '900' },
  dataRow: { flexDirection: 'row', gap: 10 },
  dataIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dataBody: { flex: 1, gap: 3 },
  dataTitle: { color: CARTOON_COLORS.charcoal, fontSize: 13, fontWeight: '900' },
  dataText: { color: CARTOON_COLORS.slate, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  controlRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  controlText: { flex: 1, color: CARTOON_COLORS.slate, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  legalButton: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E4EDF9' },
  legalButtonText: { flex: 1, color: CARTOON_COLORS.royalBlue, fontSize: 14, fontWeight: '900' },
});
