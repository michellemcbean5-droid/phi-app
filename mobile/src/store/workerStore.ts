import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WORKER_DEFINITIONS, WorkerDefinition, WorkerStatus } from '../workers/workers-15x';

export interface WorkerActivityEntry {
  id: string;
  workerId: string;
  workerRole: string;
  summary: string;
  revenueImpact: number;
  timestamp: string;
}

const MAX_ACTIVITY_LOG = 25;

interface WorkerState {
  workers: WorkerDefinition[];
  dailyRevenue: number;
  activityLog: WorkerActivityEntry[];
  coinBurstSeq: number;
  startWorker: (workerId: string) => void;
  stopWorker: (workerId: string) => void;
  startAllWorkers: () => void;
  stopAllWorkers: () => void;
  updateHeartbeat: (workerId: string) => void;
  incrementRevenue: (amount: number) => void;
  recordTaskCompletion: (workerId: string, revenueImpact?: number, summary?: string) => void;
}

const updateWorkerStatus = (
  workers: WorkerDefinition[],
  workerId: string,
  status: WorkerStatus,
): WorkerDefinition[] =>
  workers.map((worker) =>
    worker.id === workerId
      ? { ...worker, status, lastHeartbeat: new Date().toISOString() }
      : worker,
  );

const useWorkerStore = create<WorkerState>()(
  persist(
    (set) => ({
  workers: WORKER_DEFINITIONS,
  dailyRevenue: WORKER_DEFINITIONS.reduce((sum, worker) => sum + worker.revenueImpact, 0),
  activityLog: [],
  coinBurstSeq: 0,
  startWorker: (workerId) => set((state) => ({ workers: updateWorkerStatus(state.workers, workerId, 'active') })),
  stopWorker: (workerId) => set((state) => ({ workers: updateWorkerStatus(state.workers, workerId, 'idle') })),
  startAllWorkers: () =>
    set((state) => ({
      workers: state.workers.map((worker) => ({ ...worker, status: 'active', lastHeartbeat: new Date().toISOString() })),
    })),
  stopAllWorkers: () =>
    set((state) => ({
      workers: state.workers.map((worker) => ({ ...worker, status: 'idle', lastHeartbeat: new Date().toISOString() })),
    })),
  updateHeartbeat: (workerId) =>
    set((state) => ({
      workers: state.workers.map((worker) =>
        worker.id === workerId ? { ...worker, lastHeartbeat: new Date().toISOString() } : worker,
      ),
    })),
  incrementRevenue: (amount) =>
    set((state) => ({ dailyRevenue: Number((state.dailyRevenue + amount).toFixed(2)) })),
  recordTaskCompletion: (workerId, revenueImpact = 0, summary) =>
    set((state) => {
      const worker = state.workers.find((w) => w.id === workerId);
      const entry: WorkerActivityEntry = {
        id: `${Date.now()}-${workerId}`,
        workerId,
        workerRole: worker?.role ?? workerId,
        summary: summary ?? `Completed a task${revenueImpact > 0 ? ` (+$${revenueImpact.toFixed(0)})` : ''}`,
        revenueImpact,
        timestamp: new Date().toISOString(),
      };
      return {
        workers: state.workers.map((w) =>
          w.id === workerId
            ? {
                ...w,
                tasksToday: w.tasksToday + 1,
                revenueImpact: Number((w.revenueImpact + revenueImpact).toFixed(2)),
                lastHeartbeat: new Date().toISOString(),
              }
            : w,
        ),
        dailyRevenue: Number((state.dailyRevenue + revenueImpact).toFixed(2)),
        activityLog: [entry, ...state.activityLog].slice(0, MAX_ACTIVITY_LOG),
        coinBurstSeq: revenueImpact > 0 ? state.coinBurstSeq + 1 : state.coinBurstSeq,
      };
    }),
    }),
    { name: 'phi_worker_store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export default useWorkerStore;
