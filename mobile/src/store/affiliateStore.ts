import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AffiliateState {
  affiliateId: string;
  setAffiliateId: (id: string) => void;
}

const useAffiliateStore = create<AffiliateState>()(
  persist(
    (set) => ({
      affiliateId: '',
      setAffiliateId: (id) => set({ affiliateId: id.trim() }),
    }),
    { name: 'phi_affiliate_store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export default useAffiliateStore;
