import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EquipmentTypeLabel = string;

interface ProfileState {
  mcNumber: string;
  dotNumber: string;
  equipmentType: string;
  setField: (field: 'mcNumber' | 'dotNumber' | 'equipmentType', value: string) => void;
}

const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      mcNumber: '',
      dotNumber: '',
      equipmentType: '',
      setField: (field, value) => set({ [field]: value }),
    }),
    { name: 'phi_profile_store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export default useProfileStore;
