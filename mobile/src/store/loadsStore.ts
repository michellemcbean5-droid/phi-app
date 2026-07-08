import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Load } from '../workers/workers-15x';

export type BookingState = 'unbooked' | 'pending' | 'booked' | 'rejected';
export type SortOption = 'rpm' | 'rate' | 'miles';
export type PaymentStatus = 'unpaid' | 'invoice_sent' | 'paid';

export interface BookedLoadRecord {
  id: string;
  brokerName: string;
  rate: number;
  miles: number;
  rpm: number;
  bookedAt: string;
  paymentStatus: PaymentStatus;
}

interface LoadsState {
  activeLoads: Load[];
  bookingState: Record<string, BookingState>;
  bookingHistory: BookedLoadRecord[];
  filter: 'All' | 'Diamond' | 'Gold' | 'Standard';
  sortBy: SortOption;
  setLoads: (loads: Load[]) => void;
  setBookingState: (loadId: string, state: BookingState) => void;
  addBookingRecord: (record: BookedLoadRecord) => void;
  setPaymentStatus: (recordId: string, status: PaymentStatus) => void;
  setFilter: (filter: LoadsState['filter']) => void;
  setSortBy: (sortBy: SortOption) => void;
}

const useLoadsStore = create<LoadsState>()(
  persist(
    (set) => ({
      activeLoads: [],
      bookingState: {},
      bookingHistory: [],
      filter: 'All',
      sortBy: 'rpm',
      setLoads: (loads) => set({ activeLoads: loads }),
      setBookingState: (loadId, state) =>
        set((currentState) => ({
          bookingState: { ...currentState.bookingState, [loadId]: state },
        })),
      addBookingRecord: (record) =>
        set((currentState) => ({ bookingHistory: [record, ...currentState.bookingHistory] })),
      setPaymentStatus: (recordId, status) =>
        set((currentState) => ({
          bookingHistory: currentState.bookingHistory.map((r) => (r.id === recordId ? { ...r, paymentStatus: status } : r)),
        })),
      setFilter: (filter) => set({ filter }),
      setSortBy: (sortBy) => set({ sortBy }),
    }),
    {
      name: 'phi_loads_store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only the booking history is worth restoring — active loads and their transient
      // booking status should always come from a fresh aggregateLoads() call on launch.
      partialize: (state) => ({ bookingHistory: state.bookingHistory }),
    },
  ),
);

export default useLoadsStore;
