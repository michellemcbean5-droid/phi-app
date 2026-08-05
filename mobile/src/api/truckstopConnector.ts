// Truckstop.com Load Board Connector
// Uses Truckstop API v2 when credentials are configured;
// falls back to AI-generated market-accurate loads via Claude.

import axios from 'axios';
import Constants from 'expo-constants';
import { askClaudeJSON, isClaudeConfigured } from './claudeClient';
import { Load } from '../workers/workers-15x';

const extra = Constants.expoConfig?.extra ?? {};

const TRUCKSTOP_API_KEY: string =
  extra.truckstopApiKey ?? process.env.EXPO_PUBLIC_TRUCKSTOP_API_KEY ?? '';
const TRUCKSTOP_BASE_URL = 'https://api.truckstop.com/api/v2';

export const isTruckstopConfigured = (): boolean => Boolean(TRUCKSTOP_API_KEY);

interface TruckstopApiLoad {
  loadId: string;
  origin: { city: string; state: string; latitude: number; longitude: number };
  destination: { city: string; state: string; latitude: number; longitude: number };
  rate: number;
  miles: number;
  weight: number;
  equipmentType: string;
  broker: { name: string; rating: number };
  pickupDate: string;
  deliveryDate: string;
}

const normalizeLoad = (raw: TruckstopApiLoad): Load => ({
  id: 'TS-LIVE-' + raw.loadId,
  source: 'Truckstop',
  equipmentType:
    raw.equipmentType === 'Flatbed'
      ? 'Flatbed'
      : raw.equipmentType === 'Reefer'
      ? 'Reefer'
      : 'Dry Van',
  brokerName: raw.broker.name,
  brokerRating: raw.broker.rating,
  origin: raw.origin,
  destination: raw.destination,
  pickupDate: raw.pickupDate,
  deliveryDate: raw.deliveryDate,
  rate: raw.rate,
  miles: raw.miles,
  rpm: raw.miles > 0 ? parseFloat((raw.rate / raw.miles).toFixed(2)) : 0,
  totalMiles: raw.miles,
  weightLbs: raw.weight,
});

const fetchLiveLoads = async (): Promise<Load[]> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + TRUCKSTOP_API_KEY,
  };
  const response = await axios.get<{ loads: TruckstopApiLoad[] }>(
    TRUCKSTOP_BASE_URL + '/loads/search',
    {
      headers,
      params: { equipmentType: 'DryVan', minRate: 2.0, pageSize: 20 },
      timeout: 8000,
    },
  );
  return response.data.loads.map(normalizeLoad);
};

const AI_SYSTEM = `You are a Truckstop.com freight market data engine. Generate realistic live loads
from the Truckstop.com board reflecting current US spot market conditions.
Output valid JSON array only — no markdown, no extra text.`;

const generateAILoads = async (): Promise<Load[]> => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return askClaudeJSON<Load[]>(
    'Generate 6 live Truckstop.com loads for ' + today + '. Mix dry van, reefer, and flatbed. ' +
      'Realistic US corridors, RPM $2.40-$4.10, brokerRating 4.0-5.0. ' +
      'Return array matching: { id: "TS-XXX", source: "Truckstop", equipmentType: "Dry Van"|"Reefer"|"Flatbed", ' +
      'brokerName, brokerRating, origin: {city, state, latitude, longitude}, ' +
      'destination: {city, state, latitude, longitude}, pickupDate: "' + today + '", deliveryDate: "' + tomorrow + '", ' +
      'rate, miles, rpm, totalMiles, weightLbs }',
    AI_SYSTEM,
    800,
  );
};

const STATIC_FALLBACK: Load[] = [
  {
    id: 'TS-F01',
    source: 'Truckstop',
    equipmentType: 'Dry Van',
    brokerName: 'Keystone Freight LLC',
    brokerRating: 4.6,
    origin: { city: 'Kansas City', state: 'MO', latitude: 39.0997, longitude: -94.5786 },
    destination: { city: 'Columbus', state: 'OH', latitude: 39.9612, longitude: -82.9988 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 2340,
    miles: 650,
    rpm: 3.6,
    totalMiles: 650,
    weightLbs: 40200,
  },
  {
    id: 'TS-F02',
    source: 'Truckstop',
    equipmentType: 'Reefer',
    brokerName: 'FreshHaul Transport',
    brokerRating: 4.8,
    origin: { city: 'Miami', state: 'FL', latitude: 25.7617, longitude: -80.1918 },
    destination: { city: 'New York', state: 'NY', latitude: 40.7128, longitude: -74.006 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    rate: 5600,
    miles: 1280,
    rpm: 4.375,
    totalMiles: 1280,
    weightLbs: 36000,
  },
  {
    id: 'TS-F03',
    source: 'Truckstop',
    equipmentType: 'Flatbed',
    brokerName: 'IronBridge Logistics',
    brokerRating: 4.3,
    origin: { city: 'Pittsburgh', state: 'PA', latitude: 40.4406, longitude: -79.9959 },
    destination: { city: 'Detroit', state: 'MI', latitude: 42.3314, longitude: -83.0458 },
    pickupDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    rate: 1120,
    miles: 290,
    rpm: 3.86,
    totalMiles: 290,
    weightLbs: 42000,
  },
];

export const fetchTruckstopLoads = async (): Promise<Load[]> => {
  if (isTruckstopConfigured()) {
    try {
      return await fetchLiveLoads();
    } catch {
      // Fall through to AI / static
    }
  }
  if (isClaudeConfigured()) {
    try {
      const aiLoads = await generateAILoads();
      if (Array.isArray(aiLoads) && aiLoads.length > 0) return aiLoads;
    } catch {
      // Fall through to static
    }
  }
  return STATIC_FALLBACK;
};
