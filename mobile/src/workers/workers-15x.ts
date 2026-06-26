export type WorkerStatus = 'active' | 'idle' | 'error';

export interface WorkerBase {
  id: string;
  name: string;
  status: WorkerStatus;
  tasksToday: number;
  revenueImpact: number;
  lastHeartbeat: string;
}

interface NamedWorker<Name extends string> extends WorkerBase {
  name: Name;
}

export interface LoadFinderWorker extends NamedWorker<'LoadFinderWorker'> {}
export interface NegotiationStrategyWorker extends NamedWorker<'NegotiationStrategyWorker'> {}
export interface RouteAnalysisWorker extends NamedWorker<'RouteAnalysisWorker'> {}
export interface FuelOptimizerWorker extends NamedWorker<'FuelOptimizerWorker'> {}
export interface ComplianceAuditWorker extends NamedWorker<'ComplianceAuditWorker'> {}
export interface AutoBookingEngine extends NamedWorker<'AutoBookingEngine'> {}
export interface LoadScoringWorker extends NamedWorker<'LoadScoringWorker'> {}
export interface ProfitAnalystWorker extends NamedWorker<'ProfitAnalystWorker'> {}
export interface DriverAvailabilityWorker extends NamedWorker<'DriverAvailabilityWorker'> {}
export interface MarketAnalysisWorker extends NamedWorker<'MarketAnalysisWorker'> {}
export interface DocumentProcessingWorker extends NamedWorker<'DocumentProcessingWorker'> {}
export interface SocialSchedulerWorker extends NamedWorker<'SocialSchedulerWorker'> {}
export interface CustomerSupportWorker extends NamedWorker<'CustomerSupportWorker'> {}
export interface AnalyticsWorker extends NamedWorker<'AnalyticsWorker'> {}
export interface NotificationWorker extends NamedWorker<'NotificationWorker'> {}

export type WorkerDefinition =
  | LoadFinderWorker
  | NegotiationStrategyWorker
  | RouteAnalysisWorker
  | FuelOptimizerWorker
  | ComplianceAuditWorker
  | AutoBookingEngine
  | LoadScoringWorker
  | ProfitAnalystWorker
  | DriverAvailabilityWorker
  | MarketAnalysisWorker
  | DocumentProcessingWorker
  | SocialSchedulerWorker
  | CustomerSupportWorker
  | AnalyticsWorker
  | NotificationWorker;

export interface LocationPoint {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface Load {
  id: string;
  source: 'DAT' | 'Truckstop';
  equipmentType: 'Dry Van' | 'Reefer' | 'Flatbed';
  brokerName: string;
  brokerRating: number;
  origin: LocationPoint;
  destination: LocationPoint;
  pickupDate: string;
  deliveryDate: string;
  rate: number;
  miles: number;
  rpm: number;
  totalMiles: number;
  weightLbs: number;
  tasksToday?: number;
}

const buildWorker = <T extends WorkerDefinition>(worker: T): T => worker;

export const WORKER_DEFINITIONS: WorkerDefinition[] = [
  buildWorker({ id: 'load-finder', name: 'LoadFinderWorker', status: 'active', tasksToday: 18, revenueImpact: 1280, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'negotiation-strategy', name: 'NegotiationStrategyWorker', status: 'active', tasksToday: 12, revenueImpact: 940, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'route-analysis', name: 'RouteAnalysisWorker', status: 'active', tasksToday: 14, revenueImpact: 720, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'fuel-optimizer', name: 'FuelOptimizerWorker', status: 'active', tasksToday: 9, revenueImpact: 430, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'compliance-audit', name: 'ComplianceAuditWorker', status: 'idle', tasksToday: 5, revenueImpact: 0, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'auto-booking', name: 'AutoBookingEngine', status: 'active', tasksToday: 6, revenueImpact: 1650, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'load-scoring', name: 'LoadScoringWorker', status: 'active', tasksToday: 22, revenueImpact: 1080, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'profit-analyst', name: 'ProfitAnalystWorker', status: 'active', tasksToday: 11, revenueImpact: 860, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'driver-availability', name: 'DriverAvailabilityWorker', status: 'active', tasksToday: 8, revenueImpact: 390, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'market-analysis', name: 'MarketAnalysisWorker', status: 'idle', tasksToday: 7, revenueImpact: 0, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'document-processing', name: 'DocumentProcessingWorker', status: 'active', tasksToday: 15, revenueImpact: 510, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'social-scheduler', name: 'SocialSchedulerWorker', status: 'idle', tasksToday: 3, revenueImpact: 0, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'customer-support', name: 'CustomerSupportWorker', status: 'active', tasksToday: 19, revenueImpact: 275, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'analytics', name: 'AnalyticsWorker', status: 'active', tasksToday: 10, revenueImpact: 640, lastHeartbeat: new Date().toISOString() }),
  buildWorker({ id: 'notification', name: 'NotificationWorker', status: 'active', tasksToday: 24, revenueImpact: 310, lastHeartbeat: new Date().toISOString() }),
];

export class WorkerOrchestrator {
  private readonly workers: WorkerDefinition[];
  private readonly requestLedger = new Map<string, number[]>();

  constructor(workers: WorkerDefinition[] = WORKER_DEFINITIONS) {
    this.workers = workers;
  }

  heartbeatMonitor(timeoutMs = 5 * 60 * 1000): WorkerDefinition[] {
    return this.workers.map((worker) => {
      const isStale = Date.now() - new Date(worker.lastHeartbeat).getTime() > timeoutMs;
      return isStale ? { ...worker, status: 'error' } : worker;
    });
  }

  rateLimiter(workerId: string, maxPerMinute = 60): boolean {
    const now = Date.now();
    const requests = (this.requestLedger.get(workerId) ?? []).filter((timestamp) => now - timestamp < 60_000);

    if (requests.length >= maxPerMinute) {
      this.requestLedger.set(workerId, requests);
      return false;
    }

    requests.push(now);
    this.requestLedger.set(workerId, requests);
    return true;
  }
}
