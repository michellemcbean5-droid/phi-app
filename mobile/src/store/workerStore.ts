import { create } from 'zustand';
import { WORKER_DEFINITIONS, WorkerDefinition, WorkerStatus } from '../workers/workers-15x';

interface WorkerState {
  workers: WorkerDefinition[];
  dailyRevenue: number;
  startWorker: (workerId: string) => void;
  stopWorker: (workerId: string) => void;
  startAllWorkers: () => void;
  stopAllWorkers: () => void;
  updateHeartbeat: (workerId: string) => void;
  incrementRevenue: (amount: number) => void;
  recordTaskCompletion: (workerId: string, revenueImpact?: number) => void;
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

const useWorkerStore = create<WorkerState>((set) => ({
  workers: WORKER_DEFINITIONS,
  dailyRevenue: WORKER_DEFINITIONS.reduce((sum, worker) => sum + worker.revenueImpact, 0),
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
  recordTaskCompletion: (workerId, revenueImpact = 0) =>
    set((state) => ({
      workers: state.workers.map((worker) =>
        worker.id === workerId
          ? {
              ...worker,
              tasksToday: worker.tasksToday + 1,
              revenueImpact: Number((worker.revenueImpact + revenueImpact).toFixed(2)),
              lastHeartbeat: new Date().toISOString(),
            }
          : worker,
      ),
      dailyRevenue: Number((state.dailyRevenue + revenueImpact).toFixed(2)),
    })),
}));

export default useWorkerStore;
