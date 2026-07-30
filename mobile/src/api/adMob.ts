// Google Mobile Ads (AdMob) integration for PHI
// Provides interstitial, rewarded, and banner ad support.
// Uses test IDs during development to avoid policy violations.

import { Platform } from 'react-native';
import {
  MobileAds,
  InterstitialAd,
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { ADMOB_APP_ID_ANDROID, ADMOB_APP_ID_IOS } from '../config/analytics';

// ───────────────────────────────────────────────────────────────
// Ad Unit IDs
// ───────────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const AD_UNITS = {
  android: {
    appOpen: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
    interstitial: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
    rewarded: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
    banner: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
  },
  ios: {
    appOpen: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
    interstitial: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
    rewarded: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
    banner: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx',
  },
};

/** Returns the appropriate ad unit ID, using Google test IDs in dev. */
const getAdUnit = (type: 'interstitial' | 'rewarded' | 'banner'): string => {
  if (!IS_PRODUCTION) {
    switch (type) {
      case 'interstitial':
        return TestIds.INTERSTITIAL;
      case 'rewarded':
        return TestIds.REWARDED;
      case 'banner':
        return TestIds.BANNER;
    }
  }
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return AD_UNITS[platform][type];
};

// ───────────────────────────────────────────────────────────────
// Initialization
// ───────────────────────────────────────────────────────────────

let admobInitialized = false;

export const initAdMob = async (): Promise<boolean> => {
  if (admobInitialized) return true;
  try {
    const appId = Platform.OS === 'ios' ? ADMOB_APP_ID_IOS : ADMOB_APP_ID_ANDROID;
    if (!appId) {
      console.warn('[AdMob] Skipping init — no App ID configured.');
      return false;
    }
    await MobileAds().initialize();
    admobInitialized = true;
    console.log('[AdMob] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[AdMob] Initialization failed:', error);
    return false;
  }
};

// ───────────────────────────────────────────────────────────────
// Interstitial Ad
// ───────────────────────────────────────────────────────────────

let interstitialAd: InterstitialAd | null = null;
let interstitialLoadError = false;

const loadInterstitial = (): void => {
  const adUnitId = getAdUnit('interstitial');
  interstitialAd = InterstitialAd.createForAdRequest(adUnitId);
  interstitialLoadError = false;

  interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
    console.warn('[AdMob] Interstitial error:', error?.message);
    interstitialLoadError = true;
  });
  interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
    loadInterstitial(); // Pre-load next
  });
};

/**
 * Show an interstitial ad (e.g. between screen transitions).
 * Returns true if shown, false if not ready.
 */
export const showInterstitialAd = async (): Promise<boolean> => {
  if (!admobInitialized) {
    console.warn('[AdMob] Cannot show interstitial — not initialized.');
    return false;
  }
  if (!interstitialAd || interstitialLoadError) {
    loadInterstitial();
    return false;
  }
  try {
    if (interstitialAd.loaded) {
      await interstitialAd.show();
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// ───────────────────────────────────────────────────────────────
// Rewarded Ad
// ───────────────────────────────────────────────────────────────

let rewardedAd: RewardedAd | null = null;
let rewardedLoadError = false;
let rewardedEarnedCallback: ((reward: { type: string; amount: number }) => void) | null = null;

const loadRewarded = (): void => {
  const adUnitId = getAdUnit('rewarded');
  rewardedAd = RewardedAd.createForAdRequest(adUnitId);
  rewardedLoadError = false;

  rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
    console.warn('[AdMob] Rewarded error:', error?.message);
    rewardedLoadError = true;
  });
  rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
    rewardedEarnedCallback?.(reward);
  });
  rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    loadRewarded(); // Pre-load next
  });
};

/**
 * Show a rewarded ad. The onRewardEarned callback fires when the user
 * fully watches the ad.
 */
export const showRewardedAd = async (
  onRewardEarned: (reward: { type: string; amount: number }) => void
): Promise<{ shown: boolean; error?: string }> => {
  if (!admobInitialized) {
    return { shown: false, error: 'AdMob not initialized.' };
  }
  if (!rewardedAd || rewardedLoadError) {
    loadRewarded();
    return { shown: false, error: 'Rewarded ad not loaded yet.' };
  }
  try {
    if (rewardedAd.loaded) {
      rewardedEarnedCallback = onRewardEarned;
      await rewardedAd.show();
      return { shown: true };
    }
    return { shown: false, error: 'Rewarded ad not ready.' };
  } catch (error: any) {
    return { shown: false, error: error.message ?? 'Failed to show rewarded ad.' };
  }
};

// ───────────────────────────────────────────────────────────────
// Banner Ad Component
// ───────────────────────────────────────────────────────────────

export { BannerAd, BannerAdSize };

/**
 * Pre-load both ad types at app startup (after initAdMob).
 * Call this once in your App initialization effect.
 */
export const preloadAds = (): void => {
  if (!admobInitialized) return;
  loadInterstitial();
  loadRewarded();
};

/**
 * Check if ads are initialized and ready.
 */
export const isAdMobReady = (): boolean => admobInitialized;
