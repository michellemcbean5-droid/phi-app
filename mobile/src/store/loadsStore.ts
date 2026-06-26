import { create } from 'zustand';
import { Load } from '../workers/workers-15x';

export type BookingState = 'unbooked' | 'pending' | 'booked' | 'rejected';
export type SortOption = 'rpm' | 'rate' | 'miles';

interface LoadsState {
  activeLoads: Load[];
  bookingState: Record<string, BookingState>;
  filter: 'All' | 'Diamond' | 'Gold' | 'Standard';
  sortBy: SortOption;
  setLoads: (loads: Load[]) => void;
  setBookingState: (loadId: string, state: BookingState) => void;
  setFilter: (filter: LoadsState['filter']) => void;
  setSortBy: (sortBy: SortOption) => void;
}

const useLoadsStore = create<LoadsState>((set) => ({
  activeLoads: [],
  bookingState: {},
  filter: 'All',
  sortBy: 'rpm',
  setLoads: (loads) => set({ activeLoads: loads }),
  setBookingState: (loadId, state) =>
    set((currentState) => ({
      bookingState: { ...currentState.bookingState, [loadId]: state },
    })),
  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),
}));

export default useLoadsStore;
