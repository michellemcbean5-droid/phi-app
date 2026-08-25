import { create } from 'zustand';

interface TripPlannerState {
  selectedLoadIds: string[];
  toggleLoad: (loadId: string) => void;
  clearSelection: () => void;
}

const useTripPlannerStore = create<TripPlannerState>((set) => ({
  selectedLoadIds: [],
  toggleLoad: (loadId) =>
    set((state) => ({
      selectedLoadIds: state.selectedLoadIds.includes(loadId)
        ? state.selectedLoadIds.filter((id) => id !== loadId)
        : [...state.selectedLoadIds, loadId],
    })),
  clearSelection: () => set({ selectedLoadIds: [] }),
}));

export default useTripPlannerStore;
