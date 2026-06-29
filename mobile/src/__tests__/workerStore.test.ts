import { describe, expect, it, beforeEach } from 'vitest';
import { create } from 'zustand';
import { WORKER_DEFINITIONS, WorkerDefinition, WorkerStatus } from '../workers/workers-15x';

// Mock the worker store
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

const useWorkerStore = create<WorkerState>((set) => ({
  workers: WORKER_DEFINITIONS,
  dailyRevenue: WORKER_DEFINITIONS.reduce((sum, worker) => sum + worker.revenueImpact, 0),
  startWorker: (workerId) => set((state) => ({
    workers: state.workers.map((worker) =>
      worker.id === workerId
        ? { ...worker, status: 'active' as WorkerStatus, lastHeartbeat: new Date().toISOString() }
        : worker
    )
  })),
  stopWorker: (workerId) => set((state) => ({
    workers: state.workers.map((worker) =>
      worker.id === workerId
        ? { ...worker, status: 'idle' as WorkerStatus, lastHeartbeat: new Date().toISOString() }
        : worker
    )
  })),
  startAllWorkers: () =>
    set((state) => ({
      workers: state.workers.map((worker) => ({
        ...worker, 
        status: 'active' as WorkerStatus, 
        lastHeartbeat: new Date().toISOString() 
      })),
    })),
  stopAllWorkers: () =>
    set((state) => ({
      workers: state.workers.map((worker) => ({
        ...worker, 
        status: 'idle' as WorkerStatus, 
        lastHeartbeat: new Date().toISOString() 
      })),
    })),
  updateHeartbeat: (workerId) =>
    set((state) => ({
      workers: state.workers.map((worker) =>
        worker.id === workerId 
          ? { ...worker, lastHeartbeat: new Date().toISOString() }
          : worker
      ),
    })),
  incrementRevenue: (amount) =>
    set((state) => ({ 
      dailyRevenue: Number((state.dailyRevenue + amount).toFixed(2)) 
    })),
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
          : worker
      ),
      dailyRevenue: Number((state.dailyRevenue + revenueImpact).toFixed(2)),
    })),
}));

describe('WorkerStore', () => {
  let initialWorkers: WorkerDefinition[];
  let initialRevenue: number;

  beforeEach(() => {
    initialWorkers = JSON.parse(JSON.stringify(WORKER_DEFINITIONS));
    initialRevenue = initialWorkers.reduce((sum, worker) => sum + worker.revenueImpact, 0);
  });

  describe('Initial State', () => {
    it('should initialize with all worker definitions', () => {
      const state = useWorkerStore.getState();
      expect(state.workers).toHaveLength(WORKER_DEFINITIONS.length);
      expect(state.workers).toEqual(expect.arrayContaining(WORKER_DEFINITIONS));
    });

    it('should calculate initial daily revenue correctly', () => {
      const state = useWorkerStore.getState();
      const expectedRevenue = WORKER_DEFINITIONS.reduce(
        (sum, worker) => sum + worker.revenueImpact, 
        0
      );
      expect(state.dailyRevenue).toBe(expectedRevenue);
    });
  });

  describe('startWorker', () => {
    it('should change worker status to active', () => {
      const workerId = 'load-finder';
      useWorkerStore.getState().startWorker(workerId);
      
      const state = useWorkerStore.getState();
      const worker = state.workers.find(w => w.id === workerId);
      
      expect(worker?.status).toBe('active');
    });

    it('should update last heartbeat', () => {
      const workerId = 'load-finder';
      const beforeHeartbeat = useWorkerStore.getState().workers.find(w => w.id === workerId)?.lastHeartbeat;
      
      useWorkerStore.getState().startWorker(workerId);
      
      const afterHeartbeat = useWorkerStore.getState().workers.find(w => w.id === workerId)?.lastHeartbeat;
      
      expect(beforeHeartbeat).not.toBe(afterHeartbeat);
      expect(new Date(afterHeartbeat!).getTime()).toBeGreaterThan(new Date(beforeHeartbeat!).getTime());
    });

    it('should not affect other workers', () => {
      const workerId = 'load-finder';
      const otherWorkerId = 'negotiation-strategy';
      
      const initialOtherWorker = useWorkerStore.getState().workers.find(w => w.id === otherWorkerId);
      
      useWorkerStore.getState().startWorker(workerId);
      
      const updatedOtherWorker = useWorkerStore.getState().workers.find(w => w.id === otherWorkerId);
      
      expect(updatedOtherWorker?.status).toBe(initialOtherWorker?.status);
      expect(updatedOtherWorker?.lastHeartbeat).toBe(initialOtherWorker?.lastHeartbeat);
    });
  });

  describe('stopWorker', () => {
    it('should change worker status to idle', () => {
      const workerId = 'load-finder';
      useWorkerStore.getState().stopWorker(workerId);
      
      const state = useWorkerStore.getState();
      const worker = state.workers.find(w => w.id === workerId);
      
      expect(worker?.status).toBe('idle');
    });

    it('should update last heartbeat', () => {
      const workerId = 'load-finder';
      const beforeHeartbeat = useWorkerStore.getState().workers.find(w => w.id === workerId)?.lastHeartbeat;
      
      useWorkerStore.getState().stopWorker(workerId);
      
      const afterHeartbeat = useWorkerStore.getState().workers.find(w => w.id === workerId)?.lastHeartbeat;
      
      expect(beforeHeartbeat).not.toBe(afterHeartbeat);
    });
  });

  describe('startAllWorkers', () => {
    it('should set all workers to active status', () => {
      useWorkerStore.getState().startAllWorkers();
      
      const state = useWorkerStore.getState();
      const allActive = state.workers.every(worker => worker.status === 'active');
      
      expect(allActive).toBe(true);
    });

    it('should update all heartbeats', () => {
      const beforeState = useWorkerStore.getState();
      useWorkerStore.getState().startAllWorkers();
      const afterState = useWorkerStore.getState();

      afterState.workers.forEach((worker, index) => {
        expect(worker.lastHeartbeat).not.toBe(beforeState.workers[index].lastHeartbeat);
      });
    });
  });

  describe('stopAllWorkers', () => {
    it('should set all workers to idle status', () => {
      useWorkerStore.getState().stopAllWorkers();
      
      const state = useWorkerStore.getState();
      const allIdle = state.workers.every(worker => worker.status === 'idle');
      
      expect(allIdle).toBe(true);
    });
  });

  describe('updateHeartbeat', () => {
    it('should update the specified worker heartbeat', () => {
      const workerId = 'load-finder';
      const beforeHeartbeat = useWorkerStore.getState().workers.find(w => w.id === workerId)?.lastHeartbeat;
      
      useWorkerStore.getState().updateHeartbeat(workerId);
      
      const afterHeartbeat = useWorkerStore.getState().workers.find(w => w.id === workerId)?.lastHeartbeat;
      
      expect(beforeHeartbeat).not.toBe(afterHeartbeat);
    });

    it('should not affect other workers', () => {
      const workerId = 'load-finder';
      const otherWorkerId = 'negotiation-strategy';
      
      const initialOtherWorker = useWorkerStore.getState().workers.find(w => w.id === otherWorkerId);
      
      useWorkerStore.getState().updateHeartbeat(workerId);
      
      const updatedOtherWorker = useWorkerStore.getState().workers.find(w => w.id === otherWorkerId);
      
      expect(updatedOtherWorker?.lastHeartbeat).toBe(initialOtherWorker?.lastHeartbeat);
    });
  });

  describe('incrementRevenue', () => {
    it('should increase daily revenue by the specified amount', () => {
      const initialRevenue = useWorkerStore.getState().dailyRevenue;
      const amount = 100;
      
      useWorkerStore.getState().incrementRevenue(amount);
      
      const newRevenue = useWorkerStore.getState().dailyRevenue;
      expect(newRevenue).toBe(initialRevenue + amount);
    });

    it('should handle decimal amounts correctly', () => {
      const initialRevenue = useWorkerStore.getState().dailyRevenue;
      const amount = 123.456;
      
      useWorkerStore.getState().incrementRevenue(amount);
      
      const newRevenue = useWorkerStore.getState().dailyRevenue;
      // Should be rounded to 2 decimal places
      expect(newRevenue).toBe(Number((initialRevenue + amount).toFixed(2)));
    });

    it('should handle negative amounts', () => {
      const initialRevenue = useWorkerStore.getState().dailyRevenue;
      const amount = -50;
      
      useWorkerStore.getState().incrementRevenue(amount);
      
      const newRevenue = useWorkerStore.getState().dailyRevenue;
      expect(newRevenue).toBe(initialRevenue + amount);
    });
  });

  describe('recordTaskCompletion', () => {
    it('should increment worker tasksToday count', () => {
      const workerId = 'load-finder';
      const initialTasks = useWorkerStore.getState().workers.find(w => w.id === workerId)?.tasksToday || 0;
      
      useWorkerStore.getState().recordTaskCompletion(workerId);
      
      const newTasks = useWorkerStore.getState().workers.find(w => w.id === workerId)?.tasksToday || 0;
      expect(newTasks).toBe(initialTasks + 1);
    });

    it('should increase worker revenueImpact by specified amount', () => {
      const workerId = 'load-finder';
      const revenueImpact = 50;
      const initialRevenue = useWorkerStore.getState().workers.find(w => w.id === workerId)?.revenueImpact || 0;
      
      useWorkerStore.getState().recordTaskCompletion(workerId, revenueImpact);
      
      const newRevenue = useWorkerStore.getState().workers.find(w => w.id === workerId)?.revenueImpact || 0;
      expect(newRevenue).toBe(Number((initialRevenue + revenueImpact).toFixed(2)));
    });

    it('should increase daily revenue by specified amount', () => {
      const workerId = 'load-finder';
      const revenueImpact = 75;
      const initialDailyRevenue = useWorkerStore.getState().dailyRevenue;
      
      useWorkerStore.getState().recordTaskCompletion(workerId, revenueImpact);
      
      const newDailyRevenue = useWorkerStore.getState().dailyRevenue;
      expect(newDailyRevenue).toBe(Number((initialDailyRevenue + revenueImpact).toFixed(2)));
    });

    it('should update worker heartbeat', () => {
      const workerId = 'load-finder';
      const beforeHeartbeat = useWorkerStore.getState().workers.find(w => w.id === workerId)?.lastHeartbeat;
      
      useWorkerStore.getState().recordTaskCompletion(workerId, 100);
      
      const afterHeartbeat = useWorkerStore.getState().workers.find(w => w.id === workerId)?.lastHeartbeat;
      
      expect(beforeHeartbeat).not.toBe(afterHeartbeat);
    });

    it('should use default revenueImpact of 0 when not specified', () => {
      const workerId = 'load-finder';
      const initialRevenue = useWorkerStore.getState().workers.find(w => w.id === workerId)?.revenueImpact || 0;
      const initialDailyRevenue = useWorkerStore.getState().dailyRevenue;
      
      useWorkerStore.getState().recordTaskCompletion(workerId);
      
      const newRevenue = useWorkerStore.getState().workers.find(w => w.id === workerId)?.revenueImpact || 0;
      const newDailyRevenue = useWorkerStore.getState().dailyRevenue;
      
      expect(newRevenue).toBe(initialRevenue); // No change to worker revenue
      expect(newDailyRevenue).toBe(initialDailyRevenue); // No change to daily revenue
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent worker IDs gracefully', () => {
      const nonExistentWorkerId = 'non-existent-worker';
      
      // These should not throw errors
      expect(() => useWorkerStore.getState().startWorker(nonExistentWorkerId)).not.toThrow();
      expect(() => useWorkerStore.getState().stopWorker(nonExistentWorkerId)).not.toThrow();
      expect(() => useWorkerStore.getState().updateHeartbeat(nonExistentWorkerId)).not.toThrow();
      expect(() => useWorkerStore.getState().recordTaskCompletion(nonExistentWorkerId)).not.toThrow();
    });

    it('should handle zero and negative revenue amounts', () => {
      const initialRevenue = useWorkerStore.getState().dailyRevenue;
      
      useWorkerStore.getState().incrementRevenue(0);
      expect(useWorkerStore.getState().dailyRevenue).toBe(initialRevenue);
      
      useWorkerStore.getState().incrementRevenue(-100);
      expect(useWorkerStore.getState().dailyRevenue).toBe(initialRevenue - 100);
    });
  });
});
