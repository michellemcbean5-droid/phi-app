import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Load } from '../workers/workers-15x';

export interface DispatchPreferences {
  minimumAllInRpm: number;
  maximumDeadheadPercent: number;
  fuelCostPerMile: number;
}

export type DispatchVerificationKey =
  | 'brokerIdentity'
  | 'writtenRateConfirmation'
  | 'pickupDeliveryDetails'
  | 'paymentTerms'
  | 'equipmentAndWeight';

export interface DispatchPlan {
  id: string;
  load: Load;
  createdAt: string;
  verification: Record<DispatchVerificationKey, boolean>;
}

export const DISPATCH_VERIFICATION_ITEMS: Array<{ key: DispatchVerificationKey; label: string; description: string }> = [
  {
    key: 'brokerIdentity',
    label: 'Verified the broker or shipper identity',
    description: 'Use independent, official or established business sources. Do not rely on a chat message alone.',
  },
  {
    key: 'writtenRateConfirmation',
    label: 'Reviewed the written rate confirmation',
    description: 'Confirm the all-in rate, accessorials, cancellation terms, and who is responsible for deductions.',
  },
  {
    key: 'pickupDeliveryDetails',
    label: 'Confirmed pickup and delivery facts',
    description: 'Verify appointment, commodity, contact, route constraints, and trailer requirements before accepting.',
  },
  {
    key: 'paymentTerms',
    label: 'Checked payment timing and method',
    description: 'Record standard pay, quick-pay, or factoring timing and all fees before delivery.',
  },
  {
    key: 'equipmentAndWeight',
    label: 'Confirmed equipment and weight fit',
    description: 'Match the load to your equipment, permits, cargo handling capability, and legal operating limits.',
  },
];

const emptyVerification = (): Record<DispatchVerificationKey, boolean> => ({
  brokerIdentity: false,
  writtenRateConfirmation: false,
  pickupDeliveryDetails: false,
  paymentTerms: false,
  equipmentAndWeight: false,
});

interface DispatchState {
  preferences: DispatchPreferences;
  plans: DispatchPlan[];
  updatePreferences: (update: Partial<DispatchPreferences>) => void;
  savePlan: (load: Load) => void;
  removePlan: (planId: string) => void;
  toggleVerification: (planId: string, key: DispatchVerificationKey) => void;
}

const useDispatchStore = create<DispatchState>()(
  persist(
    (set) => ({
      preferences: {
        minimumAllInRpm: 2.25,
        maximumDeadheadPercent: 20,
        fuelCostPerMile: 0.62,
      },
      plans: [],
      updatePreferences: (update) =>
        set((state) => ({ preferences: { ...state.preferences, ...update } })),
      savePlan: (load) =>
        set((state) => {
          const existing = state.plans.find((plan) => plan.load.id === load.id);
          if (existing) return state;
          return {
            plans: [
              {
                id: `dispatch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                load,
                createdAt: new Date().toISOString(),
                verification: emptyVerification(),
              },
              ...state.plans,
            ],
          };
        }),
      removePlan: (planId) =>
        set((state) => ({ plans: state.plans.filter((plan) => plan.id !== planId) })),
      toggleVerification: (planId, key) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === planId
              ? { ...plan, verification: { ...plan.verification, [key]: !plan.verification[key] } }
              : plan,
          ),
        })),
    }),
    {
      name: 'phi_dispatch_store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useDispatchStore;
