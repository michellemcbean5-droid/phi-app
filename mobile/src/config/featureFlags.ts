// Feature flag system for PHI — allows toggling features without a full release.
// Flags are loaded from AsyncStorage (admin-configurable) with hard defaults.

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeatureFlags {
  realtime_loads: boolean;
  ai_load_scoring: boolean;
  ai_bid_recommendations: boolean;
  ai_next_actions: boolean;
  amazon_relay: boolean;
  coyote_board: boolean;
  truckstop_board: boolean;
  loadsmart_board: boolean;
  animated_load_cards: boolean;
  offline_mode: boolean;
  crash_reporting: boolean;
  analytics_tracking: boolean;
  ab_test_homepage: boolean;
}

const DEFAULTS: FeatureFlags = {
  realtime_loads: true,
  ai_load_scoring: true,
  ai_bid_recommendations: true,
  ai_next_actions: true,
  amazon_relay: true,
  coyote_board: true,
  truckstop_board: true,
  loadsmart_board: true,
  animated_load_cards: true,
  offline_mode: true,
  crash_reporting: true,
  analytics_tracking: true,
  ab_test_homepage: false,
};

const FLAGS_STORAGE_KEY = 'phi_feature_flags';
let flags: FeatureFlags = { ...DEFAULTS };

export const loadFeatureFlags = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(FLAGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<FeatureFlags>;
      flags = { ...DEFAULTS, ...parsed };
    }
  } catch {
    flags = { ...DEFAULTS };
  }
};

export const isEnabled = (flag: keyof FeatureFlags): boolean => flags[flag] ?? false;

export const setFlag = async (flag: keyof FeatureFlags, value: boolean): Promise<void> => {
  flags = { ...flags, [flag]: value };
  try {
    await AsyncStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(flags));
  } catch {
    // Best effort
  }
};

export const getAllFlags = (): FeatureFlags => ({ ...flags });

export const resetFlags = async (): Promise<void> => {
  flags = { ...DEFAULTS };
  await AsyncStorage.removeItem(FLAGS_STORAGE_KEY);
};
