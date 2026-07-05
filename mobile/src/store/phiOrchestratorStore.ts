// The PHI Brain's state — ONE store instead of nine independent worker toggles.
// Screens read `currentStage` to show what the pipeline is doing right now, and
// `log` to render a single chronological Live Operations Stream. There is no
// per-module pause here on purpose: the only control surface is the driver's
// autoBookEnabled prefs flag (driverPrefsStore) — a module never runs standalone.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PipelineStage =
  | 'idle'
  | 'hos-filter'
  | 'route-calc'
  | 'fuel-optimize'
  | 'broker-verify'
  | 'booking';

export type PipelineOutcome = 'pass' | 'rejected' | 'error';

export interface OrchestratorLogEntry {
  id: string;
  timestamp: string;
  stage: PipelineStage;
  loadId: string;
  message: string;
  outcome: PipelineOutcome;
}

const MAX_LOG_ENTRIES = 60;

interface PHIOrchestratorState {
  currentStage: PipelineStage;
  currentLoadId: string | null;
  log: OrchestratorLogEntry[];
  setStage: (stage: PipelineStage, loadId: string | null) => void;
  appendLog: (entry: Omit<OrchestratorLogEntry, 'id' | 'timestamp'>) => void;
  clearLog: () => void;
}

const usePHIOrchestratorStore = create<PHIOrchestratorState>()(
  persist(
    (set) => ({
      currentStage: 'idle',
      currentLoadId: null,
      log: [],

      setStage: (stage, loadId) => set({ currentStage: stage, currentLoadId: loadId }),

      appendLog: (entry) =>
        set((state) => ({
          log: [
            {
              ...entry,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: new Date().toISOString(),
            },
            ...state.log,
          ].slice(0, MAX_LOG_ENTRIES),
        })),

      clearLog: () => set({ log: [] }),
    }),
    {
      name: 'phi_orchestrator',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ log: state.log }),
    },
  ),
);

export default usePHIOrchestratorStore;
