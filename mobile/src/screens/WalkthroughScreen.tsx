import React, { useRef, useState } from 'react';
import {
  Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import { RootStackParamList } from '../navigation/RootNavigator';
import useOnboardingStore from '../store/onboardingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'search-outline',
    color: PHI_COLORS.sunshineYellow,
    title: 'Find & Book Freight',
    body: 'The Loads tab shows real dry van opportunities. Tap "Analyze Route" to check deadhead miles and hazards before you commit, then "Book Load" when you\'re ready — no phone calls to a broker required.',
  },
  {
    icon: 'hardware-chip-outline',
    color: '#7EA5FF',
    title: '10 AI Workers, Always On',
    body: 'Your AI Command Center runs 10 workers that handle dispatch, negotiation, compliance, fuel planning, and more — automatically, as you use the app. Free plan: bring your own API key. Paid plans: PHI runs it for you.',
  },
  {
    icon: 'map-outline',
    color: '#7EE787',
    title: 'Route Analysis & Hazards',
    body: 'Analyze Route pulls up a real map with your route, active weather alerts, and weigh stations along the way. If a safer alternate exists, PHI flags it — you always confirm the switch, it never reroutes on its own.',
  },
  {
    icon: 'mic-outline',
    color: '#FF5252',
    title: 'Hands-Free Mode',
    body: 'Turn on Hands-Free Mode in Settings and PHI reads out loud when new loads are found and when your AI workers complete tasks — so you can keep your eyes on the road.',
  },
  {
    icon: 'trending-up-outline',
    color: PHI_COLORS.moneyGreen,
    title: 'Earnings & Getting Paid',
    body: 'Track real net profit, RPM trend, and yearly projection. Send a professional invoice straight to the broker from the Get Paid section, and set up your payout preferences in Settings.',
  },
  {
    icon: 'shield-checkmark-outline',
    color: '#9BE8FF',
    title: 'Documents & Compliance',
    body: 'Scan your BOL, POD, and permits into the Virtual Glovebox. The Compliance tab tracks Hours of Service and generates a real, shareable DOT audit report — not just a popup.',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    color: '#FFB6E1',
    title: 'Ask Michelle Anytime',
    body: 'Michelle is PHI\'s built-in assistant — ask her how anything works, or tap Troubleshoot for a live system check. On Solo and up, she\'s one tap away from any screen via the floating button.',
  },
];

export default function WalkthroughScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setHasSeenWalkthrough } = useOnboardingStore();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const finish = (): void => {
    setHasSeenWalkthrough(true);
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Main');
  };

  const handleNext = (): void => {
    if (index >= SLIDES.length - 1) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== index) setIndex(newIndex);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>How PHI Works</Text>
        <TouchableOpacity onPress={finish}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconWrap, { backgroundColor: item.color + '22', borderColor: item.color }]}>
              <Ionicons name={item.icon} size={48} color={item.color} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>{index >= SLIDES.length - 1 ? "Let's Go" : 'Next'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { color: PHI_COLORS.white, fontSize: 16, fontWeight: '800' },
  skipText: { color: '#7F9FCC', fontSize: 14, fontWeight: '700' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  title: { color: PHI_COLORS.white, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  body: { color: '#D7E3FF', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#29508C' },
  dotActive: { backgroundColor: PHI_COLORS.sunshineYellow, width: 20 },
  nextButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 20, alignItems: 'center' },
  nextButtonText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 16 },
});
