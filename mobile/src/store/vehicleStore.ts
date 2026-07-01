import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VehicleRecord {
  id: string;
  year: string;
  make: string;
  model: string;
  plate: string;
  vin: string;
  gpsEnabled: boolean;
}

const createBlankVehicle = (): VehicleRecord => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  year: '',
  make: '',
  model: '',
  plate: '',
  vin: '',
  gpsEnabled: true,
});

interface VehicleState {
  vehicles: VehicleRecord[];
  addVehicle: () => void;
  updateVehicle: (id: string, field: keyof Omit<VehicleRecord, 'id' | 'gpsEnabled'>, value: string) => void;
  toggleGps: (id: string) => void;
  removeVehicle: (id: string) => void;
}

const useVehicleStore = create<VehicleState>()(
  persist(
    (set) => ({
      vehicles: [createBlankVehicle()],
      addVehicle: () => set((state) => ({ vehicles: [...state.vehicles, createBlankVehicle()] })),
      updateVehicle: (id, field, value) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
        })),
      toggleGps: (id) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, gpsEnabled: !v.gpsEnabled } : v)),
        })),
      removeVehicle: (id) =>
        set((state) => ({ vehicles: state.vehicles.filter((v) => v.id !== id) })),
    }),
    { name: 'phi_vehicle_store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export default useVehicleStore;
