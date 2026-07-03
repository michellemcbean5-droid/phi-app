// Hands-Free Mode — narrates key app events out loud via expo-speech so a driver
// doesn't need to look at or touch the screen while moving. Toggle lives in Settings;
// narrate() is called from wherever an event is worth announcing (worker task
// completions, new loads found, hazard/HOS alerts).

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

interface HandsFreeState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  narrate: (text: string) => void;
}

const useHandsFreeStore = create<HandsFreeState>()(
  persist(
    (set, get) => ({
      enabled: false,
      setEnabled: (enabled) => {
        set({ enabled });
        if (enabled) Speech.speak('Hands-free mode on. I\'ll read out important updates as they happen.', { rate: 0.95 });
        else Speech.stop();
      },
      narrate: (text) => {
        if (!get().enabled) return;
        Speech.speak(text, { rate: 0.95 });
      },
    }),
    { name: 'phi_hands_free_store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export default useHandsFreeStore;
