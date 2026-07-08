// Load discovery powered by PHI AI, mixing four simulated load board sources
// (DAT, Truckstop, 123Loadboard, Uber Freight) — real commercial APIs for these
// boards require paid contracts this app doesn't hold, so listings are AI-generated,
// market-accurate freight based on current date and real corridor patterns.
// Falls back to curated static loads when offline.

import { askClaudeJSON, isClaudeConfigured } from '../api/claudeClient';
import { scoreLoad } from './LoadScoringWorker';
import { generateAIOutreachEmail } from './NegotiationStrategyWorker';
import { Load } from './workers-15x';

const LOAD_BOARD_SYSTEM = `You are a freight market intelligence engine for PHI (Prince Haul Intelligence).
Generate realistic dry van and reefer truckload opportunities reflecting current US spot market conditions.
Always output valid JSON array only — no markdown, no explanation, no extra text.`;

const STATIC_LOADS: Load[] = [
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
    id: 'TS-301',
    source: 'Truckstop',
    equipmentType: 'Dry Van',
    brokerName: 'Sunlane Brokerage',
    brokerRating: 4.2,
    origin: { city: 'Memphis', state: 'TN', latitude: 35.1495, longitude: -90.049 },
    destination: { city: 'Chicago', state: 'IL', latitude: 41.8781, longitude: -87.6298 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 1765,
    miles: 545,
    rpm: 3.24,
    totalMiles: 545,
    weightLbs: 39200,
  },
  {
    id: 'TS-302',
    source: 'Truckstop',
    equipmentType: 'Dry Van',
    brokerName: 'MidState Carriers',
    brokerRating: 4.4,
    origin: { city: 'Houston', state: 'TX', latitude: 29.7604, longitude: -95.3698 },
    destination: { city: 'Charlotte', state: 'NC', latitude: 35.2271, longitude: -80.8431 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    rate: 2980,
    miles: 1020,
    rpm: 2.92,
    totalMiles: 1020,
    weightLbs: 44000,
  },
  {
    id: '123LB-201',
    source: '123Loadboard',
    equipmentType: 'Dry Van',
    brokerName: 'Heartland Freight Solutions',
    brokerRating: 4.3,
    origin: { city: 'Kansas City', state: 'MO', latitude: 39.0997, longitude: -94.5786 },
    destination: { city: 'Denver', state: 'CO', latitude: 39.7392, longitude: -104.9903 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 2210,
    miles: 605,
    rpm: 3.65,
    totalMiles: 605,
    weightLbs: 40100,
  },
  {
    id: 'UF-401',
    source: 'Uber Freight',
    equipmentType: 'Dry Van',
    brokerName: 'Uber Freight Direct',
    brokerRating: 4.6,
    origin: { city: 'Phoenix', state: 'AZ', latitude: 33.4484, longitude: -112.074 },
    destination: { city: 'Los Angeles', state: 'CA', latitude: 34.0522, longitude: -118.2437 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 1580,
    miles: 372,
    rpm: 4.25,
    totalMiles: 372,
    weightLbs: 36800,
  },
];

const generateAILoads = async (count: number): Promise<Load[]> => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return askClaudeJSON<Load[]>(
    `Generate ${count} available dry van truckloads for today (${today}) across major US freight corridors.
    Mix loads across all four sources: DAT, Truckstop, 123Loadboard, and Uber Freight. Only include loads with brokerRating >= 4.0.
    RPM range: $2.50-$4.20 for current spot market.
    Return JSON array with objects matching exactly this TypeScript type:
    [{ "id": "DAT-XXX" or "TS-XXX" or "123LB-XXX" or "UF-XXX", "source": "DAT" | "Truckstop" | "123Loadboard" | "Uber Freight", "equipmentType": "Dry Van", "brokerName": "...", "brokerRating": 4.0-5.0, "origin": { "city": "...", "state": "XX", "latitude": N.N, "longitude": -N.N }, "destination": { "city": "...", "state": "XX", "latitude": N.N, "longitude": -N.N }, "pickupDate": "${today}", "deliveryDate": "${tomorrow}", "rate": 2000-4500, "miles": 300-1200, "rpm": 2.50-4.20, "totalMiles": 300-1200, "weightLbs": 25000-45000 }]`,
    LOAD_BOARD_SYSTEM,
    1200,
  );
};

export const aggregateLoads = async (): Promise<Load[]> => {
  let loads: Load[] = STATIC_LOADS;

  if (isClaudeConfigured()) {
    try {
      const aiLoads = await generateAILoads(6);
      if (Array.isArray(aiLoads) && aiLoads.length > 0) {
        loads = aiLoads;
      }
    } catch {
      // Use static fallback
    }
  }

  const qualifiedLoads = loads.filter(
    (load) =>
      load.equipmentType === 'Dry Van' &&
      load.brokerRating >= 4.0 &&
      load.rpm > 0 &&
      load.id.trim().length > 0,
  );

  for (const load of qualifiedLoads) {
    try {
      const score = scoreLoad(load);
      if (score === 'Diamond' || score === 'Gold') {
        void generateAIOutreachEmail(load, 'Balanced', score === 'Diamond' ? 'High' : 'Medium');
      }
    } catch {
      // Scoring failed for this load — skip
    }
  }

  return qualifiedLoads;
};
