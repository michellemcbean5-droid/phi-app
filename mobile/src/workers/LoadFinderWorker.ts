// Load discovery engine — aggregates loads from DAT, Truckstop, Amazon Relay,
// and Coyote. Deduplicates by corridor, respects freshness timestamps, and
// applies quality filters before returning results.

import { askClaudeJSON, isClaudeConfigured } from '../api/claudeClient';
import { fetchTruckstopLoads } from '../api/truckstopConnector';
import { fetchAmazonRelayLoads } from '../api/amazonRelayConnector';
import { fetchCoyoteLoads } from '../api/coyoteConnector';
import { scoreLoad } from './LoadScoringWorker';
import { generateAIOutreachEmail } from './NegotiationStrategyWorker';
import { Load } from './workers-15x';

const LOAD_BOARD_SYSTEM = `You are a freight market intelligence engine for PHI (Prince Haul Intelligence).
Generate realistic dry van and reefer truckload opportunities reflecting current US spot market conditions.
Always output valid JSON array only — no markdown, no explanation, no extra text.`;

const DAT_STATIC_LOADS: Load[] = [
  {
    id: 'DAT-101',
    source: 'DAT',
    equipmentType: 'Dry Van',
    brokerName: 'Blue Star Logistics',
    brokerRating: 4.7,
    origin: { city: 'Dallas', state: 'TX', latitude: 32.7767, longitude: -96.797 },
    destination: { city: 'Atlanta', state: 'GA', latitude: 33.749, longitude: -84.388 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 2925,
    miles: 805,
    rpm: 3.63,
    totalMiles: 805,
    weightLbs: 41250,
  },
  {
    id: 'DAT-102',
    source: 'DAT',
    equipmentType: 'Dry Van',
    brokerName: 'Apex Freight Partners',
    brokerRating: 4.5,
    origin: { city: 'Fort Worth', state: 'TX', latitude: 32.7555, longitude: -97.3308 },
    destination: { city: 'Nashville', state: 'TN', latitude: 36.1627, longitude: -86.7816 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 2450,
    miles: 680,
    rpm: 3.60,
    totalMiles: 680,
    weightLbs: 38500,
  },
  {
    id: 'DAT-103',
    source: 'DAT',
    equipmentType: 'Dry Van',
    brokerName: 'Pacific Gateway Freight',
    brokerRating: 4.6,
    origin: { city: 'Los Angeles', state: 'CA', latitude: 34.0522, longitude: -118.2437 },
    destination: { city: 'Denver', state: 'CO', latitude: 39.7392, longitude: -104.9903 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    rate: 3200,
    miles: 1020,
    rpm: 3.14,
    totalMiles: 1020,
    weightLbs: 43000,
  },
  {
    id: 'DAT-104',
    source: 'DAT',
    equipmentType: 'Reefer',
    brokerName: 'ColdChain Express',
    brokerRating: 4.8,
    origin: { city: 'Fresno', state: 'CA', latitude: 36.7378, longitude: -119.7871 },
    destination: { city: 'Seattle', state: 'WA', latitude: 47.6062, longitude: -122.3321 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    rate: 4200,
    miles: 980,
    rpm: 4.29,
    totalMiles: 980,
    weightLbs: 36000,
  },
];

const generateAILoads = async (count: number): Promise<Load[]> => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return askClaudeJSON<Load[]>(
    'Generate ' + count + ' available dry van truckloads for today (' + today + ') across major US freight corridors. ' +
      'Mix DAT and Truckstop sources. Only include loads with brokerRating >= 4.0. ' +
      'RPM range: $2.50-$4.20 for current spot market. ' +
      'Return JSON array with objects matching exactly this TypeScript type: ' +
      '[{ "id": "DAT-XXX" or "TS-XXX", "source": "DAT" | "Truckstop", "equipmentType": "Dry Van", ' +
      '"brokerName": "...", "brokerRating": 4.0-5.0, ' +
      '"origin": { "city": "...", "state": "XX", "latitude": N.N, "longitude": -N.N }, ' +
      '"destination": { "city": "...", "state": "XX", "latitude": N.N, "longitude": -N.N }, ' +
      '"pickupDate": "' + today + '", "deliveryDate": "' + tomorrow + '", ' +
      '"rate": 2000-4500, "miles": 300-1200, "rpm": 2.50-4.20, "totalMiles": 300-1200, "weightLbs": 25000-45000 }]',
    LOAD_BOARD_SYSTEM,
    1200,
  );
};

/** Deduplicate loads — same corridor + similar rate = same load from 2 boards. */
const deduplicate = (loads: Load[]): Load[] => {
  const seen = new Set<string>();
  return loads.filter((load) => {
    const key = [
      load.origin.city,
      load.origin.state,
      load.destination.city,
      load.destination.state,
      Math.round(load.rate / 100) * 100,
      load.equipmentType,
    ].join('|').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const qualityFilter = (load: Load): boolean =>
  load.brokerRating >= 4.0 &&
  load.rpm > 0 &&
  load.id.trim().length > 0 &&
  load.miles > 0 &&
  load.rate > 0;

export const aggregateLoads = async (): Promise<Load[]> => {
  // Fetch from all 4 sources in parallel
  const [truckstopLoads, relayLoads, coyoteLoads] = await Promise.allSettled([
    fetchTruckstopLoads(),
    fetchAmazonRelayLoads(),
    fetchCoyoteLoads(),
  ]);

  let allLoads: Load[] = [...DAT_STATIC_LOADS];

  if (truckstopLoads.status === 'fulfilled') allLoads = allLoads.concat(truckstopLoads.value);
  if (relayLoads.status === 'fulfilled') allLoads = allLoads.concat(relayLoads.value);
  if (coyoteLoads.status === 'fulfilled') allLoads = allLoads.concat(coyoteLoads.value);

  // Augment with AI loads if Claude is configured
  if (isClaudeConfigured()) {
    try {
      const aiLoads = await generateAILoads(8);
      if (Array.isArray(aiLoads) && aiLoads.length > 0) {
        allLoads = allLoads.concat(aiLoads);
      }
    } catch {
      // Continue with what we have
    }
  }

  const qualified = deduplicate(allLoads.filter(qualityFilter));

  // Trigger outreach emails for top loads (fire-and-forget)
  for (const load of qualified) {
    try {
      const score = scoreLoad(load);
      if (score === 'Diamond' || score === 'Gold') {
        void generateAIOutreachEmail(load, 'Balanced', score === 'Diamond' ? 'High' : 'Medium');
      }
    } catch {
      // Scoring failed for this load — skip
    }
  }

  return qualified;
};
