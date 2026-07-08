import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  hasSeenWalkthrough: boolean;
  setHasSeenWalkthrough: (value: boolean) => void;
}

const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenWalkthrough: false,
      setHasSeenWalkthrough: (value) => set({ hasSeenWalkthrough: value }),
    }),
    { name: 'phi_onboarding_store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export default useOnboardingStore;
