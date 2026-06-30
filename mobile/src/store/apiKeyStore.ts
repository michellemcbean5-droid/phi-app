// Customer-owned API keys — stored securely via expo-secure-store.
// Customers enter their own keys so PHI uses their accounts (and quotas).
// Keys override EXPO_PUBLIC_ env vars when present.

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export interface CustomerAPIKeys {
  anthropicKey: string;
  orsKey: string;
  eiaKey: string;
  stripeKey: string;
  datApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
}

const STORE_KEY = 'phi_customer_api_keys';

const EMPTY_KEYS: CustomerAPIKeys = {
  anthropicKey: '',
  orsKey: '',
  eiaKey: '',
  stripeKey: '',
  datApiKey: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
};

interface APIKeyState {
  keys: CustomerAPIKeys;
  loaded: boolean;
  loadKeys: () => Promise<void>;
  saveKey: (field: keyof CustomerAPIKeys, value: string) => Promise<void>;
  clearAllKeys: () => Promise<void>;
  getEffectiveKey: (field: keyof CustomerAPIKeys, envFallback?: string) => string;
}

const useAPIKeyStore = create<APIKeyState>((set, get) => ({
  keys: EMPTY_KEYS,
  loaded: false,

  loadKeys: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CustomerAPIKeys;
        set({ keys: { ...EMPTY_KEYS, ...parsed }, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  saveKey: async (field, value) => {
    const current = get().keys;
    const updated = { ...current, [field]: value.trim() };
    set({ keys: updated });
    try {
      await SecureStore.setItemAsync(STORE_KEY, JSON.stringify(updated));
    } catch {
      // SecureStore not available in test env — silently skip
    }
  },

  clearAllKeys: async () => {
    set({ keys: EMPTY_KEYS });
    try {
      await SecureStore.deleteItemAsync(STORE_KEY);
    } catch {
      // Ignore
    }
  },

  getEffectiveKey: (field, envFallback = '') => {
    const customerKey = get().keys[field];
    return customerKey || envFallback;
  },
}));

export default useAPIKeyStore;
