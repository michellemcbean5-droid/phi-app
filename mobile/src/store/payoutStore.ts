// Payout preferences — setup only. PHI does not move money yet; there is no payment
// processor wired up behind this. This stores what a driver WOULD use once one is
// connected (see backend/README or the payments section of the app README), same
// as the customer API keys: encrypted on-device via expo-secure-store, never sent
// anywhere by this store itself.

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export type PayoutMethod = 'direct_deposit' | 'factoring_company' | 'check';

export interface PayoutPreferences {
  method: PayoutMethod;
  accountHolderName: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  factoringCompanyName: string;
}

const STORE_KEY = 'phi_payout_preferences';

const EMPTY_PREFS: PayoutPreferences = {
  method: 'direct_deposit',
  accountHolderName: '',
  bankName: '',
  routingNumber: '',
  accountNumber: '',
  factoringCompanyName: '',
};

interface PayoutState {
  prefs: PayoutPreferences;
  loaded: boolean;
  loadPrefs: () => Promise<void>;
  setField: (field: keyof PayoutPreferences, value: string) => Promise<void>;
  isConfigured: () => boolean;
}

const usePayoutStore = create<PayoutState>((set, get) => ({
  prefs: EMPTY_PREFS,
  loaded: false,

  loadPrefs: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PayoutPreferences;
        set({ prefs: { ...EMPTY_PREFS, ...parsed }, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  setField: async (field, value) => {
    const updated = { ...get().prefs, [field]: value };
    set({ prefs: updated });
    try {
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(updated));
    } catch {
      // SecureStore not available in test env — silently skip
    }
  },

  isConfigured: () => {
    const { method, accountHolderName, routingNumber, accountNumber, factoringCompanyName } = get().prefs;
    if (method === 'factoring_company') return Boolean(factoringCompanyName.trim());
    if (method === 'check') return Boolean(accountHolderName.trim());
    return Boolean(accountHolderName.trim() && routingNumber.trim() && accountNumber.trim());
  },
}));

export default usePayoutStore;
