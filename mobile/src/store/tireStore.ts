import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TireReading } from '../workers/TireWearWorker';

interface TireState {
  readingsByVehicle: Record<string, TireReading[]>;
  logReading: (vehicleId: string, reading: TireReading) => void;
}

const useTireStore = create<TireState>()(
  persist(
    (set) => ({
      readingsByVehicle: {},
      logReading: (vehicleId, reading) =>
        set((state) => ({
          readingsByVehicle: {
            ...state.readingsByVehicle,
            [vehicleId]: [...(state.readingsByVehicle[vehicleId] ?? []), reading],
          },
        })),
    }),
    { name: 'phi_tire_store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export default useTireStore;
