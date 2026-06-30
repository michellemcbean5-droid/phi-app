// Promo code + subscription trial tracking.
// Validates codes client-side (production would call a server endpoint).

import { create } from 'zustand';
import { UserTier } from '../utils/subscriptionGating';

export interface PromoResult {
  code: string;
  tier: UserTier;
  trialDays: number;
  message: string;
}

// Valid promo codes — production: validate server-side
const PROMO_CODES: Record<string, Omit<PromoResult, 'code'>> = {
  PHIFREE30: { tier: 'Enterprise', trialDays: 30, message: '30-day Enterprise free trial activated! All 15 AI workers unlocked.' },
  OWNER1TRUCK: { tier: 'Solo', trialDays: 14, message: '14-day Solo free trial activated! 5 AI workers unlocked.' },
  PHITEST: { tier: 'Fleet', trialDays: 7, message: '7-day Fleet trial activated! 10 AI workers unlocked.' },
  PHIVIP: { tier: 'Enterprise', trialDays: 60, message: '60-day VIP Enterprise trial activated! Full PHI stack unlocked.' },
  PHIFIRSTRUN: { tier: 'Fleet', trialDays: 30, message: '30-day Fleet trial for new PHI drivers! Welcome aboard.' },
};

interface PromoState {
  activeTier: UserTier;
  trialExpiresAt: string | null;
  redeemedCodes: string[];
  paymentStatus: 'trial' | 'active' | 'expired' | 'none';
  applyPromoCode: (code: string) => PromoResult | { error: string };
  setActiveTier: (tier: UserTier, paidUntil?: string) => void;
  isTrialActive: () => boolean;
  daysRemaining: () => number;
}

const usePromoStore = create<PromoState>((set, get) => ({
  activeTier: 'Solo',
  trialExpiresAt: null,
  redeemedCodes: [],
  paymentStatus: 'none',

  applyPromoCode: (rawCode) => {
    const code = rawCode.trim().toUpperCase();
    const promo = PROMO_CODES[code];

    if (!promo) return { error: 'Invalid promo code. Check spelling and try again.' };
    if (get().redeemedCodes.includes(code)) return { error: 'This code has already been redeemed.' };

    const expiresAt = new Date(Date.now() + promo.trialDays * 24 * 60 * 60 * 1000).toISOString();

    set((state) => ({
      activeTier: promo.tier,
      trialExpiresAt: expiresAt,
      paymentStatus: 'trial',
      redeemedCodes: [...state.redeemedCodes, code],
    }));

    return { code, ...promo };
  },

  setActiveTier: (tier, paidUntil) => {
    set({
      activeTier: tier,
      trialExpiresAt: paidUntil ?? null,
      paymentStatus: paidUntil ? 'active' : 'none',
    });
  },

  isTrialActive: () => {
    const { trialExpiresAt, paymentStatus } = get();
    if (paymentStatus !== 'trial' || !trialExpiresAt) return false;
    return new Date(trialExpiresAt).getTime() > Date.now();
  },

  daysRemaining: () => {
    const { trialExpiresAt } = get();
    if (!trialExpiresAt) return 0;
    const ms = new Date(trialExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  },
}));

export default usePromoStore;
