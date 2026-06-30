export type WorkerStatus = 'active' | 'idle' | 'error';

export interface WorkerBase {
  id: string;
  name: string;
  role: string;
  description: string;
  aiPoweredBy: string;
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
  buildWorker({
    id: 'load-finder',
    name: 'LoadFinderWorker',
    role: '🔍 Load Scout',
    description: 'Continuously scans DAT and Truckstop-style boards for loads matching your home base, equipment type, and RPM floor. Surfaces only pre-filtered, high-value opportunities.',
    aiPoweredBy: 'Claude AI + DAT API',
    status: 'active', tasksToday: 18, revenueImpact: 1280, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'negotiation-strategy',
    name: 'NegotiationStrategyWorker',
    role: '💬 Rate Negotiator',
    description: 'Crafts broker-specific negotiation emails based on current market rates, load age, and broker history. Recommends walk-away rates and counter-offer tactics to maximize RPM.',
    aiPoweredBy: 'Claude AI + Market Data',
    status: 'active', tasksToday: 12, revenueImpact: 940, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'route-analysis',
    name: 'RouteAnalysisWorker',
    role: '🗺️ Route Optimizer',
    description: 'Calculates truck-legal routes using OpenRouteService HGV routing, accounting for weight restrictions, bridge clearances, and HazMat zones. Returns true miles and deadhead cost.',
    aiPoweredBy: 'OpenRouteService + Claude AI',
    status: 'active', tasksToday: 14, revenueImpact: 720, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'fuel-optimizer',
    name: 'FuelOptimizerWorker',
    role: '⛽ Fuel Strategist',
    description: 'Pulls live national diesel prices from EIA Open Data and identifies the cheapest fueling stops along your route. Calculates real fuel cost per load and toll corridor estimates.',
    aiPoweredBy: 'EIA Open Data + Claude AI',
    status: 'active', tasksToday: 9, revenueImpact: 430, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'compliance-audit',
    name: 'ComplianceAuditWorker',
    role: '📋 DOT Compliance Officer',
    description: 'Monitors Hours of Service using real GPS clock-in timestamps. Flags HOS violations before they happen, audits daily transaction logs, and generates AI-powered DOT safety reports.',
    aiPoweredBy: 'Claude AI + GPS (expo-location)',
    status: 'idle', tasksToday: 5, revenueImpact: 0, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'auto-booking',
    name: 'AutoBookingEngine',
    role: '🤖 Auto Dispatcher',
    description: 'When auto-book mode is ON, automatically books loads that exceed your RPM trigger — no driver action required. Sends push confirmation and logs the booking to your earnings.',
    aiPoweredBy: 'Claude AI + Driver Prefs Store',
    status: 'active', tasksToday: 6, revenueImpact: 1650, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'load-scoring',
    name: 'LoadScoringWorker',
    role: '⭐ Load Ranker',
    description: 'Scores every available load on a 0–100 composite index using RPM, broker rating, deadhead miles, pickup urgency, and lane profitability. Drives the Diamond/Gold/Standard filter UI.',
    aiPoweredBy: 'Scoring Algorithm + Claude AI',
    status: 'active', tasksToday: 22, revenueImpact: 1080, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'profit-analyst',
    name: 'ProfitAnalystWorker',
    role: '💰 Profit Tracker',
    description: 'Calculates net profit per load after fuel, tolls, maintenance reserves, and insurance proration. Tracks RPM trends, projects annual earnings, and flags loads that look good but run negative.',
    aiPoweredBy: 'Profit Formula + Claude AI',
    status: 'active', tasksToday: 11, revenueImpact: 860, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'driver-availability',
    name: 'DriverAvailabilityWorker',
    role: '⏱️ HOS Guardian',
    description: 'Tracks remaining drive hours and rest resets in real time. Blocks load suggestions that would cause an HOS violation and alerts the driver when the warning threshold is approaching.',
    aiPoweredBy: 'GPS Session Tracker + HOS Rules Engine',
    status: 'active', tasksToday: 8, revenueImpact: 390, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'market-analysis',
    name: 'MarketAnalysisWorker',
    role: '📊 Market Intel',
    description: 'Analyzes lane rate trends, seasonal demand patterns, and regional market conditions. Tells you when rates are rising or dropping so you know when to hold for better freight.',
    aiPoweredBy: 'Claude AI + DAT Market Data',
    status: 'idle', tasksToday: 7, revenueImpact: 0, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'document-processing',
    name: 'DocumentProcessingWorker',
    role: '📄 Doc Manager',
    description: 'Manages BOL uploads, insurance certificates, registration renewals, and IFTA mileage logs. Sends expiry reminders and keeps your compliance documents audit-ready.',
    aiPoweredBy: 'Claude AI + expo-document-picker',
    status: 'active', tasksToday: 15, revenueImpact: 510, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'social-scheduler',
    name: 'SocialSchedulerWorker',
    role: '📣 Brand Builder',
    description: 'Generates social posts and load updates for driver recruitment and brand building. Schedules content about your operation to attract brokers and shippers directly.',
    aiPoweredBy: 'Claude AI',
    status: 'idle', tasksToday: 3, revenueImpact: 0, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'customer-support',
    name: 'CustomerSupportWorker',
    role: '🎧 Broker Relations',
    description: 'Manages broker communication threads, follows up on unpaid invoices, and escalates payment disputes. Keeps relationships warm even when you\'re on the road and unavailable.',
    aiPoweredBy: 'Claude AI',
    status: 'active', tasksToday: 19, revenueImpact: 275, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'analytics',
    name: 'AnalyticsWorker',
    role: '📈 Revenue Intelligence',
    description: 'Aggregates all worker data into your earnings dashboard. Tracks weekly revenue vs targets, identifies your most profitable lanes and brokers, and generates monthly P&L snapshots.',
    aiPoweredBy: 'Affiliate Tracker + Profit Formula',
    status: 'active', tasksToday: 10, revenueImpact: 640, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'notification',
    name: 'NotificationWorker',
    role: '🔔 Alert System',
    description: 'Delivers push alerts for new load matches, HOS warnings, auto-book confirmations, and compliance flags. Uses Expo Push Notifications — free, no third-party SMS cost.',
    aiPoweredBy: 'Expo Push Notifications (free)',
    status: 'active', tasksToday: 24, revenueImpact: 310, lastHeartbeat: new Date().toISOString(),
  }),
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
