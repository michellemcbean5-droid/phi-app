// PHI Unified AI Service Layer
// Provides model routing (fast vs deep), context packing, safety guardrails,
// response caching, and fallbacks for all AI-powered features.

import { askClaudeJSON, askClaude, isClaudeConfigured } from './claudeClient';
import { Load } from '../workers/workers-15x';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AIPriority = 'fast' | 'balanced' | 'deep';

export interface AILoadScore {
  loadId: string;
  score: number; // 0-100
  tier: 'Diamond' | 'Gold' | 'Standard' | 'Pass';
  reasoning: string;
  rpmVsMarket: 'Above' | 'At' | 'Below';
  deadheadRisk: 'Low' | 'Medium' | 'High';
  brokerTrust: 'Verified' | 'Good' | 'Caution';
  recommendation: string;
}

export interface AIBidRecommendation {
  suggestedRate: number;
  suggestedRpm: number;
  confidence: 'High' | 'Medium' | 'Low';
  rationale: string;
  negotiationTip: string;
  walkAwayRate: number;
}

export interface AINextAction {
  action: string;
  priority: 'Urgent' | 'Normal' | 'Info';
  icon: string;
  reason: string;
  tapTarget?: string;
}

export interface AIDeadheadSuggestion {
  fromCity: string;
  toCity: string;
  deadheadMiles: number;
  alternateLoads: string[];
  fuelSavingEstimate: number;
  reasoning: string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry<T> { value: T; expiresAt: number }
const cache = new Map<string, CacheEntry<unknown>>();

const getCache = <T>(key: string): T | null => {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.value;
};

const setCache = <T>(key: string, value: T, ttlMs: number): void => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

// ─── Context Packer ───────────────────────────────────────────────────────────

const packLoadContext = (load: Load): string =>
  [
    'Load: ' + load.id,
    'Route: ' + load.origin.city + ', ' + load.origin.state + ' → ' + load.destination.city + ', ' + load.destination.state,
    'Miles: ' + load.miles + ' | Rate: $' + load.rate + ' | RPM: $' + load.rpm,
    'Equipment: ' + load.equipmentType,
    'Weight: ' + load.weightLbs.toLocaleString() + ' lbs',
    'Broker: ' + load.brokerName + ' (' + load.brokerRating.toFixed(1) + '★)',
    'Pickup: ' + load.pickupDate,
  ].join('\n');

// ─── Safety Guardrail ─────────────────────────────────────────────────────────

const BLOCKED_TOPICS = ['personal info', 'credit card', 'ssn', 'password'];

const isSafeQuery = (query: string): boolean => {
  const lower = query.toLowerCase();
  return !BLOCKED_TOPICS.some((t) => lower.includes(t));
};

// ─── AI Load Scorer ───────────────────────────────────────────────────────────

const SCORE_SYSTEM = `You are a senior freight dispatcher AI for PHI (Prince Haul Intelligence).
Score loads based on RPM vs market rates, deadhead risk, broker reliability, and driver profitability.
Be concise. Output valid JSON only.`;

export const scoreLoadWithAI = async (load: Load): Promise<AILoadScore> => {
  const cacheKey = 'ai-score-' + load.id + '-' + load.rpm;
  const cached = getCache<AILoadScore>(cacheKey);
  if (cached) return cached;

  const fallback: AILoadScore = {
    loadId: load.id,
    score: load.rpm > 3.5 ? 88 : load.rpm > 2.5 ? 65 : 40,
    tier: load.rpm > 3.5 ? 'Diamond' : load.rpm > 2.5 ? 'Gold' : 'Standard',
    reasoning: 'Scored by RPM threshold. Configure AI key for detailed analysis.',
    rpmVsMarket: load.rpm > 3.2 ? 'Above' : load.rpm > 2.6 ? 'At' : 'Below',
    deadheadRisk: 'Medium',
    brokerTrust: load.brokerRating >= 4.5 ? 'Verified' : load.brokerRating >= 4.0 ? 'Good' : 'Caution',
    recommendation: load.rpm > 3.5 ? 'Take this load — excellent rate.' : 'Negotiate or compare alternatives.',
  };

  if (!isClaudeConfigured()) return fallback;

  try {
    const result = await askClaudeJSON<AILoadScore>(
      'Score this freight load for a dry van owner-operator:\n\n' + packLoadContext(load) + '\n\n' +
        'Return JSON: { loadId, score (0-100), tier ("Diamond"|"Gold"|"Standard"|"Pass"), ' +
        'reasoning (1 sentence), rpmVsMarket ("Above"|"At"|"Below"), deadheadRisk ("Low"|"Medium"|"High"), ' +
        'brokerTrust ("Verified"|"Good"|"Caution"), recommendation (1 actionable sentence) }',
      SCORE_SYSTEM,
      400,
    );
    if (result?.score !== undefined) {
      setCache(cacheKey, result, 5 * 60 * 1000); // 5 min TTL
      return result;
    }
  } catch {
    // Return fallback
  }
  return fallback;
};

// ─── AI Bid Recommender ───────────────────────────────────────────────────────

const BID_SYSTEM = `You are an expert freight rate negotiator for owner-operators.
Recommend optimal bid rates that maximize driver revenue while staying competitive.
Output valid JSON only.`;

export const getBidRecommendation = async (
  load: Load,
  priority: AIPriority = 'balanced',
): Promise<AIBidRecommendation> => {
  const cacheKey = 'ai-bid-' + load.id;
  const cached = getCache<AIBidRecommendation>(cacheKey);
  if (cached) return cached;

  const fallback: AIBidRecommendation = {
    suggestedRate: Math.round(load.rate * 1.05),
    suggestedRpm: parseFloat((load.rpm * 1.05).toFixed(2)),
    confidence: 'Medium',
    rationale: 'Opening 5% above posted. Configure AI key for market-based analysis.',
    negotiationTip: 'Emphasize your on-time record and equipment condition.',
    walkAwayRate: Math.round(load.rate * 0.92),
  };

  if (!isClaudeConfigured()) return fallback;

  try {
    const result = await askClaudeJSON<AIBidRecommendation>(
      'Recommend a bid rate for this load:\n\n' + packLoadContext(load) + '\n\n' +
        'Strategy: ' + priority + '. Return JSON: { suggestedRate (integer), suggestedRpm (2 decimals), ' +
        'confidence ("High"|"Medium"|"Low"), rationale (1 sentence), negotiationTip (1 actionable tip), ' +
        'walkAwayRate (integer minimum acceptable) }',
      BID_SYSTEM,
      300,
    );
    if (result?.suggestedRate) {
      setCache(cacheKey, result, 10 * 60 * 1000);
      return result;
    }
  } catch {
    // Return fallback
  }
  return fallback;
};

// ─── AI Next Best Action ──────────────────────────────────────────────────────

const ACTION_SYSTEM = `You are a proactive freight AI assistant. Suggest the driver's most valuable next action.
Be brief, direct, and driver-focused. Output valid JSON array only.`;

export const getNextBestActions = async (context: {
  activeLoads: Load[];
  dailyRevenue: number;
  activeWorkers: number;
  currentHour: number;
}): Promise<AINextAction[]> => {
  const cacheKey = 'ai-actions-' + context.currentHour + '-' + context.activeLoads.length;
  const cached = getCache<AINextAction[]>(cacheKey);
  if (cached) return cached;

  const fallbackActions: AINextAction[] = [
    {
      action: 'Check new loads',
      priority: 'Normal',
      icon: 'cube-outline',
      reason: context.activeLoads.length === 0 ? 'No loads loaded — refresh now' : context.activeLoads.length + ' loads available',
      tapTarget: 'Loads',
    },
    {
      action: 'Review AI workers',
      priority: 'Normal',
      icon: 'hardware-chip-outline',
      reason: context.activeWorkers + ' workers active — check their status',
      tapTarget: 'AI',
    },
  ];

  if (!isClaudeConfigured()) return fallbackActions;

  try {
    const result = await askClaudeJSON<AINextAction[]>(
      'Driver context:\n' +
        '- Active loads visible: ' + context.activeLoads.length + '\n' +
        '- Daily revenue so far: $' + context.dailyRevenue.toFixed(0) + '\n' +
        '- AI workers active: ' + context.activeWorkers + '\n' +
        '- Current hour: ' + context.currentHour + '\n\n' +
        'Suggest 3 next best actions. Return JSON array: ' +
        '[{ action (short label), priority ("Urgent"|"Normal"|"Info"), icon (Ionicons name), ' +
        'reason (1 sentence), tapTarget ("Dashboard"|"Loads"|"AI"|"Earnings"|"Profile") }]',
      ACTION_SYSTEM,
      350,
    );
    if (Array.isArray(result) && result.length > 0) {
      setCache(cacheKey, result, 15 * 60 * 1000);
      return result;
    }
  } catch {
    // Return fallback
  }
  return fallbackActions;
};

// ─── AI Deadhead Reducer ──────────────────────────────────────────────────────

export const getDeadheadSuggestions = async (
  currentCity: string,
  currentState: string,
  loads: Load[],
): Promise<AIDeadheadSuggestion | null> => {
  if (!isClaudeConfigured() || loads.length === 0) return null;

  const cacheKey = 'ai-deadhead-' + currentCity + '-' + currentState;
  const cached = getCache<AIDeadheadSuggestion>(cacheKey);
  if (cached) return cached;

  const topLoads = loads.slice(0, 5).map((l) => l.origin.city + ', ' + l.origin.state).join('; ');

  try {
    const result = await askClaudeJSON<AIDeadheadSuggestion>(
      'Driver is currently in ' + currentCity + ', ' + currentState + '. ' +
        'Available load pickup cities: ' + topLoads + '. ' +
        'Recommend the best pickup to minimize deadhead miles and maximize profitability. ' +
        'Return JSON: { fromCity, toCity, deadheadMiles (estimate), alternateLoads (string[]), ' +
        'fuelSavingEstimate (dollars), reasoning (1-2 sentences) }',
      'You are a route optimization AI for trucking. Minimize deadhead, maximize RPM. JSON only.',
      400,
    );
    if (result?.fromCity) {
      setCache(cacheKey, result, 20 * 60 * 1000);
      return result;
    }
  } catch {
    return null;
  }
  return null;
};

// ─── AI Profitability Scorer ──────────────────────────────────────────────────

export const getProfitabilityScore = (load: Load, costPerMile: number): number => {
  const grossRevenue = load.rate;
  const totalCost = load.miles * costPerMile;
  const netProfit = grossRevenue - totalCost;
  const netRpm = load.miles > 0 ? netProfit / load.miles : 0;

  if (netRpm > 2.0) return 95;
  if (netRpm > 1.5) return 80;
  if (netRpm > 1.0) return 65;
  if (netRpm > 0.5) return 45;
  return 20;
};

// ─── Broker Reliability Score ─────────────────────────────────────────────────

export const getBrokerReliabilityLabel = (
  rating: number,
): { label: string; color: string; icon: string } => {
  if (rating >= 4.7) return { label: 'Top Rated', color: '#00C853', icon: 'shield-checkmark' };
  if (rating >= 4.3) return { label: 'Reliable', color: '#4A90FF', icon: 'thumbs-up' };
  if (rating >= 4.0) return { label: 'Good', color: '#FFD93D', icon: 'star' };
  return { label: 'Verify', color: '#FF5252', icon: 'warning' };
};

// ─── Feature Flag Guard ───────────────────────────────────────────────────────

export const isAIEnabled = (): boolean => isClaudeConfigured();
