import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DutyStatus, DutyStatusEvent } from '../workers/HOSClockWorker';

// Bound how far back we keep events — the HOS clock only ever needs to look back far
// enough to find a qualifying 10h+ reset, so 34h of history is generous headroom.
const RETENTION_HOURS = 34;

interface DutyStatusState {
  events: DutyStatusEvent[];
  logStatus: (status: DutyStatus, timestampISO?: string) => void;
  currentStatus: () => DutyStatus | null;
}

const useDutyStatusStore = create<DutyStatusState>()(
  persist(
    (set, get) => ({
      events: [],
      logStatus: (status, timestampISO) => {
        const timestamp = timestampISO ?? new Date().toISOString();
        const cutoff = Date.now() - RETENTION_HOURS * 3600000;
        set((state) => {
          const last = state.events[state.events.length - 1];
          if (last && last.status === status) return state;
          const pruned = state.events.filter((e) => new Date(e.timestampISO).getTime() >= cutoff);
          return { events: [...pruned, { status, timestampISO: timestamp }] };
        });
      },
      currentStatus: () => {
        const events = get().events;
        return events.length > 0 ? events[events.length - 1].status : null;
      },
    }),
    {
      name: 'phi_duty_status_store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useDutyStatusStore;
