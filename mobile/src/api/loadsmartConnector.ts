// Loadsmart load board connector — 5th load board integration
// Uses Claude AI to generate market-accurate Loadsmart-style freight opportunities.
// In production, replace with actual Loadsmart API (carrier.loadsmart.com/api).

import { askClaudeJSON, isClaudeConfigured } from './claudeClient';
import { Load } from '../workers/workers-15x';

const LOADSMART_SYSTEM = `You are a freight market data engine simulating the Loadsmart load board.
Generate realistic instant-booking dry van and reefer truckload opportunities.
Always output valid JSON array only — no markdown, no explanation.`;

// Static fallback loads representative of Loadsmart's instant-book model
const LOADSMART_STATIC_LOADS: Load[] = [
  {
    id: 'LS-201',
    source: 'Loadsmart',
    equipmentType: 'Dry Van',
    brokerName: 'Loadsmart Instant Book',
    brokerRating: 4.9,
    origin: { city: 'Chicago', state: 'IL', latitude: 41.8781, longitude: -87.6298 },
    destination: { city: 'Indianapolis', state: 'IN', latitude: 39.7684, longitude: -86.1581 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 1150,
    miles: 180,
    rpm: 3.89,
    totalMiles: 180,
    weightLbs: 38000,
  },
  {
    id: 'LS-202',
    source: 'Loadsmart',
    equipmentType: 'Dry Van',
    brokerName: 'Loadsmart Instant Book',
    brokerRating: 4.8,
    origin: { city: 'Miami', state: 'FL', latitude: 25.7617, longitude: -80.1918 },
    destination: { city: 'Jacksonville', state: 'FL', latitude: 30.3322, longitude: -81.6557 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 1280,
    miles: 340,
    rpm: 3.76,
    totalMiles: 340,
    weightLbs: 40000,
  },
  {
    id: 'LS-203',
    source: 'Loadsmart',
    equipmentType: 'Reefer',
    brokerName: 'Loadsmart Instant Book',
    brokerRating: 4.7,
    origin: { city: 'Phoenix', state: 'AZ', latitude: 33.4484, longitude: -112.074 },
    destination: { city: 'Las Vegas', state: 'NV', latitude: 36.1699, longitude: -115.1398 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 1540,
    miles: 290,
    rpm: 5.31,
    totalMiles: 290,
    weightLbs: 32000,
  },
  {
    id: 'LS-204',
    source: 'Loadsmart',
    equipmentType: 'Dry Van',
    brokerName: 'Loadsmart Instant Book',
    brokerRating: 4.6,
    origin: { city: 'Columbus', state: 'OH', latitude: 39.9612, longitude: -82.9988 },
    destination: { city: 'Pittsburgh', state: 'PA', latitude: 40.4406, longitude: -79.9959 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 780,
    miles: 185,
    rpm: 3.51,
    totalMiles: 185,
    weightLbs: 35500,
  },
];

export const fetchLoadsmartLoads = async (): Promise<Load[]> => {
  if (isClaudeConfigured()) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const aiLoads = await askClaudeJSON<Load[]>(
        `Generate 4 available Loadsmart instant-book truckloads for ${today}. ` +
          'Focus on short-to-medium haul (100–500 miles), instant-book model, dry van or reefer. ' +
          'RPM range $3.00–$5.50 for Loadsmart premium pricing. ' +
          'Return JSON array matching: ' +
          '[{ "id": "LS-XXX", "source": "Loadsmart", "equipmentType": "Dry Van"|"Reefer", ' +
          '"brokerName": "Loadsmart Instant Book", "brokerRating": 4.5-5.0, ' +
          '"origin": { "city": "...", "state": "XX", "latitude": N, "longitude": -N }, ' +
          '"destination": { "city": "...", "state": "XX", "latitude": N, "longitude": -N }, ' +
          `"pickupDate": "${today}", "deliveryDate": "${tomorrow}", ` +
          '"rate": 800-3000, "miles": 100-500, "rpm": 3.0-5.5, "totalMiles": 100-500, "weightLbs": 20000-45000 }]',
        LOADSMART_SYSTEM,
        800,
      );
      if (Array.isArray(aiLoads) && aiLoads.length > 0) return aiLoads;
    } catch {
      // Fall through to static loads
    }
  }
  return LOADSMART_STATIC_LOADS;
};
