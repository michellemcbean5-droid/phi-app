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

export interface DispatchCoordinatorWorker extends NamedWorker<'DispatchCoordinatorWorker'> {}
export interface FreightNegotiatorWorker extends NamedWorker<'FreightNegotiatorWorker'> {}
export interface RouteOptimizerWorker extends NamedWorker<'RouteOptimizerWorker'> {}
export interface ComplianceSafetyWorker extends NamedWorker<'ComplianceSafetyWorker'> {}
export interface InvoiceSpecialistWorker extends NamedWorker<'InvoiceSpecialistWorker'> {}
export interface FuelOptimizerWorker extends NamedWorker<'FuelOptimizerWorker'> {}
export interface LoadScoringWorker extends NamedWorker<'LoadScoringWorker'> {}
export interface ProfitAnalystWorker extends NamedWorker<'ProfitAnalystWorker'> {}
export interface DocumentManagerWorker extends NamedWorker<'DocumentManagerWorker'> {}
export interface NotificationWorker extends NamedWorker<'NotificationWorker'> {}

export type WorkerDefinition =
  | DispatchCoordinatorWorker
  | FreightNegotiatorWorker
  | RouteOptimizerWorker
  | ComplianceSafetyWorker
  | InvoiceSpecialistWorker
  | FuelOptimizerWorker
  | LoadScoringWorker
  | ProfitAnalystWorker
  | DocumentManagerWorker
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
    id: 'dispatch-coordinator',
    name: 'DispatchCoordinatorWorker',
    role: '📡 Dispatch Coordinator',
    description: 'The command center. Acts as the main bridge between freight brokers and the truck on the road — assigning loads, confirming pickups, relaying delivery updates, and managing the full load lifecycle so the driver never has to chase a broker.',
    aiPoweredBy: 'Claude AI + DAT API + Driver Prefs',
    status: 'active', tasksToday: 24, revenueImpact: 1850, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'freight-negotiator',
    name: 'FreightNegotiatorWorker',
    role: '💬 Freight Negotiator',
    description: 'Scans DAT and Truckstop-style load boards 24/7. Analyzes live market rates by lane, bids on high-paying freight, and negotiates with human or AI brokers to secure the best rate per mile — without the driver lifting a finger.',
    aiPoweredBy: 'Claude AI + DAT Market Data + Rate Analysis',
    status: 'active', tasksToday: 18, revenueImpact: 1420, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'route-optimizer',
    name: 'RouteOptimizerWorker',
    role: '🗺️ Route Optimizer',
    description: 'Maps every trip using live traffic data, incoming weather storms, bridge height and weight restrictions, and HazMat zones. Delivers the fastest, safest, most fuel-efficient route possible — updated in real time as conditions change.',
    aiPoweredBy: 'OpenRouteService HGV + Claude AI + Weather API',
    status: 'active', tasksToday: 16, revenueImpact: 740, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'compliance-safety',
    name: 'ComplianceSafetyWorker',
    role: '🛡️ Compliance & Safety Officer',
    description: 'Strictly monitors ELD data and enforces Hours of Service rules before violations happen. Handles IFTA fuel tax reporting, flags inspection risks, and keeps the entire operation DOT compliant — acting as a full-time safety auditor on every run.',
    aiPoweredBy: 'Claude AI + ELD/GPS Session Tracker + HOS Rules Engine',
    status: 'active', tasksToday: 12, revenueImpact: 0, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'invoice-specialist',
    name: 'InvoiceSpecialistWorker',
    role: '🧾 Finance & Invoice Specialist',
    description: 'The moneymaker. The moment a load is delivered and the proof of delivery is signed, this agent instantly generates a professional invoice, submits it to factoring companies for same-day payment, and logs the accounts receivable — so cash hits the bank fast.',
    aiPoweredBy: 'Claude AI + Stripe + Factoring Integration',
    status: 'active', tasksToday: 9, revenueImpact: 2100, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'fuel-optimizer',
    name: 'FuelOptimizerWorker',
    role: '⛽ Fuel Optimizer',
    description: 'Fuel is the biggest expense in trucking. This agent scans real-time diesel prices at every truck stop along the route, calculates the optimal fill-up strategy, and tells the driver exactly which stops to use — maximizing profit on every single mile.',
    aiPoweredBy: 'EIA Open Data (live diesel prices) + Claude AI',
    status: 'active', tasksToday: 11, revenueImpact: 510, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'fleet-maintenance',
    name: 'LoadScoringWorker',
    role: '🔧 Fleet Maintenance Monitor',
    description: 'The Mechanic. Tracks the truck\'s mileage, engine diagnostics, and wear-and-tear in real time. Predicts when an oil change, tire rotation, or brake check is needed — and schedules preventative maintenance before a breakdown happens on the road.',
    aiPoweredBy: 'Claude AI + Vehicle Telemetry + Maintenance Schedules',
    status: 'active', tasksToday: 8, revenueImpact: 620, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'track-trace',
    name: 'ProfitAnalystWorker',
    role: '📍 Track & Trace Agent',
    description: 'Customer Service on autopilot. Automatically sends shippers and receivers real-time email and SMS updates with live ETA tracking — so clients never have to call and ask "Where is my freight?" Keeps customers happy without the driver saying a word.',
    aiPoweredBy: 'Claude AI + GPS (expo-location) + Expo Notifications',
    status: 'active', tasksToday: 19, revenueImpact: 340, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'driver-liaison',
    name: 'DocumentManagerWorker',
    role: '🚛 Driver Liaison',
    description: 'The digital co-pilot inside the cab. Manages digital Bills of Lading, alerts the driver to upcoming weigh stations and port-of-entry checkpoints, and schedules mandatory rest stops to keep the driver legal, rested, and on time.',
    aiPoweredBy: 'Claude AI + GPS + HOS Rules Engine',
    status: 'active', tasksToday: 14, revenueImpact: 0, lastHeartbeat: new Date().toISOString(),
  }),
  buildWorker({
    id: 'business-intelligence',
    name: 'NotificationWorker',
    role: '📊 Business Intelligence Executive',
    description: 'The CEO\'s right hand. Pulls live data from all 9 other agents to calculate real-time Cost Per Mile (CPM) and Profit & Loss (P&L). Delivers a daily executive summary of the company\'s financial health — so the owner always knows exactly how the business is performing.',
    aiPoweredBy: 'Claude AI + All Agent Data Feeds',
    status: 'active', tasksToday: 12, revenueImpact: 1100, lastHeartbeat: new Date().toISOString(),
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
