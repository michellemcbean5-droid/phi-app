import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Load } from '../workers/workers-15x';

export type BookingState = 'unbooked' | 'pending' | 'booked' | 'rejected';
export type SortOption = 'rpm' | 'rate' | 'miles';

export interface BookedLoadRecord {
  id: string;
  rate: number;
  miles: number;
  rpm: number;
  bookedAt: string;
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
