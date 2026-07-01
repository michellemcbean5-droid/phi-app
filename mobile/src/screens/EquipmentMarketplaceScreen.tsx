// Equipment marketplace — helps drivers buy or lease their own truck/van without
// needing a company, and earns PHI a referral commission when you sign up for these
// partner programs with your own affiliate ID below (zero cost to the driver).

import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PHI_COLORS } from '../assets/brandColors';
import useAffiliateStore from '../store/affiliateStore';

interface EquipmentLink {
  name: string;
  description: string;
  url: string;
  kind: 'Buy' | 'Lease' | 'Rent';
}

interface EquipmentCategory {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  blurb: string;
  links: EquipmentLink[];
}

const CATEGORIES: EquipmentCategory[] = [
  {
    title: 'Over-the-Road / Long Haul',
    icon: 'trail-sign-outline',
    blurb: 'Semi-tractors for owner-operators running long-haul freight.',
    links: [
      { name: 'Arrow Truck Sales', description: 'Nationwide used semi-tractor marketplace popular with owner-operators.', url: 'https://www.arrowtruck.com', kind: 'Buy' },
      { name: 'Truck Paper', description: 'The largest heavy truck & trailer classifieds marketplace.', url: 'https://www.truckpaper.com', kind: 'Buy' },
      { name: 'Ryder Used Trucks & Leasing', description: 'Buy used or lease a semi-tractor with maintenance included.', url: 'https://www.ryder.com/en-us/used-trucks', kind: 'Lease' },
    ],
  },
  {
    title: 'Local & City Delivery',
    icon: 'business-outline',
    blurb: 'Box trucks for regional and local delivery routes.',
    links: [
      { name: 'Penske Truck Leasing', description: 'Lease a box truck with nationwide maintenance support.', url: 'https://www.pensketruckleasing.com', kind: 'Lease' },
      { name: 'Commercial Truck Trader', description: 'Buy new or used box trucks near you.', url: 'https://www.commercialtrucktrader.com', kind: 'Buy' },
    ],
  },
  {
    title: 'Last-Mile & Courier',
    icon: 'bicycle-outline',
    blurb: 'Cargo vans for last-mile, courier, and gig delivery work.',
    links: [
      { name: 'Enterprise Truck Rental', description: 'Rent or lease a cargo van short-term to test a route before buying.', url: 'https://www.enterprisetrucks.com', kind: 'Rent' },
      { name: 'Commercial Truck Trader (Vans)', description: 'Buy a used Sprinter, Transit, or ProMaster cargo van.', url: 'https://www.commercialtrucktrader.com/Cargo-Van', kind: 'Buy' },
    ],
  },
];

const KIND_COLORS: Record<EquipmentLink['kind'], string> = {
  Buy: PHI_COLORS.moneyGreen,
  Lease: PHI_COLORS.sunshineYellow,
  Rent: '#7EA5FF',
};

export default function EquipmentMarketplaceScreen() {
  const { affiliateId, setAffiliateId } = useAffiliateStore();
  const [input, setInput] = useState(affiliateId);

  const handleOpen = async (link: EquipmentLink): Promise<void> => {
    const url = affiliateId ? `${link.url}?ref=${encodeURIComponent(affiliateId)}` : link.url;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Can’t Open Link', 'Your device couldn’t open this website.');
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.introCard}>
          <Ionicons name="car-sport-outline" size={28} color={PHI_COLORS.sunshineYellow} />
          <Text style={styles.introTitle}>Own Your Equipment, Own Your Business</Text>
          <Text style={styles.introText}>
            These partner marketplaces help you buy or lease the right truck or van for the work you do — no
            company or dispatcher needed. Choose the category that matches your freight.
          </Text>
        </View>

        <View style={styles.affiliateCard}>
          <Text style={styles.affiliateLabel}>Your Referral / Affiliate ID (optional)</Text>
          <View style={styles.affiliateRow}>
            <TextInput
              style={styles.affiliateInput}
              value={input}
              onChangeText={setInput}
              placeholder="e.g. your Ryder or Arrow affiliate code"
              placeholderTextColor="#7F8FB3"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.affiliateSaveButton} onPress={() => setAffiliateId(input)}>
              <Text style={styles.affiliateSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.affiliateHint}>
            Sign up for each partner's own affiliate program to earn a commission when other drivers you refer buy
            or lease through these links.
          </Text>
        </View>

        {CATEGORIES.map((category) => (
          <View key={category.title} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Ionicons name={category.icon} size={22} color={PHI_COLORS.sunshineYellow} />
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
            <Text style={styles.categoryBlurb}>{category.blurb}</Text>
            {category.links.map((link) => (
              <TouchableOpacity key={link.name} style={styles.linkRow} onPress={() => void handleOpen(link)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkName}>{link.name}</Text>
                  <Text style={styles.linkDescription}>{link.description}</Text>
                </View>
                <View style={[styles.kindBadge, { backgroundColor: KIND_COLORS[link.kind] }]}>
                  <Text style={styles.kindBadgeText}>{link.kind}</Text>
                </View>
                <Ionicons name="open-outline" size={18} color="#7F9FCC" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PHI_COLORS.surface },
  content: { padding: 16, gap: 16 },
  introCard: { backgroundColor: PHI_COLORS.royalBlue, borderRadius: 20, padding: 20, gap: 8 },
  introTitle: { color: PHI_COLORS.white, fontSize: 18, fontWeight: '900' },
  introText: { color: '#D7E3FF', lineHeight: 20 },
  affiliateCard: { backgroundColor: PHI_COLORS.card, borderRadius: 16, padding: 16, gap: 10 },
  affiliateLabel: { color: PHI_COLORS.white, fontWeight: '800', fontSize: 13 },
  affiliateRow: { flexDirection: 'row', gap: 10 },
  affiliateInput: { flex: 1, backgroundColor: '#132B52', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: PHI_COLORS.white, borderWidth: 1, borderColor: '#29508C' },
  affiliateSaveButton: { backgroundColor: PHI_COLORS.sunshineYellow, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  affiliateSaveText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800' },
  affiliateHint: { color: '#7F9FCC', fontSize: 12, lineHeight: 17 },
  categoryCard: { backgroundColor: PHI_COLORS.card, borderRadius: 18, padding: 16, gap: 10 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryTitle: { color: PHI_COLORS.white, fontWeight: '900', fontSize: 16 },
  categoryBlurb: { color: '#A8B7D8', fontSize: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#21406F' },
  linkName: { color: PHI_COLORS.white, fontWeight: '700', fontSize: 14 },
  linkDescription: { color: '#A8B7D8', fontSize: 12, marginTop: 2 },
  kindBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  kindBadgeText: { color: PHI_COLORS.charcoalBlack, fontWeight: '800', fontSize: 10 },
});
