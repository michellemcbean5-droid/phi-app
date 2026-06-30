// AI Dispatcher preferences — the driver sets these ONCE and the AI works autonomously.
// Workers read these prefs to filter, score, negotiate, and book loads automatically.

import { create } from 'zustand';

export type EquipmentPref = 'Dry Van' | 'Reefer' | 'Flatbed' | 'Any';

export interface DriverPrefs {
  homeCity: string;
  homeState: string;
  equipmentType: EquipmentPref;
  minRPM: number;
  minBrokerRating: number;
  maxDeadheadMiles: number;
  preferredStates: string[];
  avoidStates: string[];
  autoBookEnabled: boolean;
  autoBookMinRPM: number;
  maxTripMiles: number;
  minTripMiles: number;
  targetDailyRevenue: number;
  hosWarningThresholdHours: number;
}

const DEFAULT_PREFS: DriverPrefs = {
  homeCity: 'Fort Worth',
  homeState: 'TX',
  equipmentType: 'Dry Van',
  minRPM: 2.50,
  minBrokerRating: 4.0,
  maxDeadheadMiles: 100,
  preferredStates: ['TX', 'TN', 'GA', 'FL', 'NC', 'IL'],
  avoidStates: [],
  autoBookEnabled: false,
  autoBookMinRPM: 3.20,
  maxTripMiles: 1200,
  minTripMiles: 200,
  targetDailyRevenue: 1500,
  hosWarningThresholdHours: 2,
};

interface DriverPrefsState {
  prefs: DriverPrefs;
  updatePref: <K extends keyof DriverPrefs>(key: K, value: DriverPrefs[K]) => void;
  resetPrefs: () => void;
}

const useDriverPrefsStore = create<DriverPrefsState>((set) => ({
  prefs: DEFAULT_PREFS,

  updatePref: (key, value) =>
    set((state) => ({ prefs: { ...state.prefs, [key]: value } })),

  resetPrefs: () => set({ prefs: DEFAULT_PREFS }),
}));

export default useDriverPrefsStore;
