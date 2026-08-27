import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EquipmentTypeLabel = string;
export type ProfileField =
  | 'fullName' | 'phone' | 'cdlNumber' | 'cdlState' | 'cdlClass' | 'mcNumber' | 'dotNumber' | 'equipmentType'
  | 'cdlExpiry' | 'medicalCardExpiry' | 'nextInspectionDue';

interface ProfileState {
  fullName: string;
  phone: string;
  cdlNumber: string;
  cdlState: string;
  cdlClass: string;
  mcNumber: string;
  dotNumber: string;
  equipmentType: string;
  cdlExpiry: string;
  medicalCardExpiry: string;
  nextInspectionDue: string;
  setField: (field: ProfileField, value: string) => void;
  isComplete: () => boolean;
}

const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      fullName: '',
      phone: '',
      cdlNumber: '',
      cdlState: '',
      cdlClass: '',
      mcNumber: '',
      dotNumber: '',
      equipmentType: '',
      cdlExpiry: '',
      medicalCardExpiry: '',
      nextInspectionDue: '',
      setField: (field, value) => set({ [field]: value }),
      isComplete: () => Boolean(get().fullName.trim() && get().cdlNumber.trim() && get().cdlState.trim()),
    }),
    { name: 'phi_profile_store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export default useProfileStore;
