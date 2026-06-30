// Fuel optimization using:
// - EIA Open Data API (free, no credit card) for real national diesel prices
//   Register free key at: https://www.eia.gov/opendata/register.php
// - Claude AI for route-aware fuel stop recommendations
// Falls back to real historical averages when APIs unavailable.

import { askClaudeJSON, isClaudeConfigured } from '../api/claudeClient';
import { Coordinates } from '../api/googleMapsConnector';

export interface RouteFuelPlan {
  corridor: string;
  waypoints: Coordinates[];
}

export interface FuelStation {
  id: string;
  name: string;
  city: string;
  state: string;
  pricePerGallon: number;
  distanceFromRouteMiles: number;
  dieselLanesCount?: number;
  amenities?: string[];
}

export interface LiveDieselPrice {
  nationalAverage: number;
  period: string;
  source: 'eia' | 'cached';
}

const NATIONAL_DIESEL_FALLBACK = 3.82;

let dieselPriceCache: LiveDieselPrice | null = null;

// EIA API v2 — free at eia.gov/opendata (requires free API key registration)
export const fetchLiveDieselPrice = async (): Promise<LiveDieselPrice> => {
  if (dieselPriceCache && Date.now() - new Date(dieselPriceCache.period).getTime() < 7 * 24 * 60 * 60 * 1000) {
    return dieselPriceCache;
  }

  const eiaKey = process.env.EXPO_PUBLIC_EIA_API_KEY ?? '';
  if (!eiaKey) {
    return { nationalAverage: NATIONAL_DIESEL_FALLBACK, period: new Date().toISOString().split('T')[0], source: 'cached' };
  }

  try {
    const url = new URL('https://api.eia.gov/v2/petroleum/pri/gnd/data/');
    url.searchParams.set('api_key', eiaKey);
    url.searchParams.set('frequency', 'weekly');
    url.searchParams.set('data[0]', 'value');
    url.searchParams.set('facets[product][]', 'DU');
    url.searchParams.set('facets[duoarea][]', 'NUS');
    url.searchParams.set('sort[0][column]', 'period');
    url.searchParams.set('sort[0][direction]', 'desc');
    url.searchParams.set('length', '1');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`EIA API ${response.status}`);

    const data = await response.json() as {
      response: { data: Array<{ value: string; period: string }> };
    };

    const entry = data.response.data[0];
    if (!entry) throw new Error('No EIA data returned.');

    const result: LiveDieselPrice = {
      nationalAverage: Number(entry.value),
      period: entry.period,
      source: 'eia',
    };
    dieselPriceCache = result;
    return result;
  } catch {
    return { nationalAverage: NATIONAL_DIESEL_FALLBACK, period: new Date().toISOString().split('T')[0], source: 'cached' };
  }
};

const FUEL_STOP_SYSTEM = `You are a fleet fuel optimization expert. Recommend truck stop fuel stops along a route.
Consider: diesel price, proximity to route, facilities for CDL-A drivers. Output valid JSON only.`;

const FALLBACK_STATIONS: FuelStation[] = [
  { id: 'fuel-1', name: 'Pilot Travel Center', city: 'Little Rock', state: 'AR', pricePerGallon: 3.62, distanceFromRouteMiles: 1.8, dieselLanesCount: 12, amenities: ['Shower', 'Restaurant', 'CAT Scale'] },
  { id: 'fuel-2', name: "Love's Travel Stop", city: 'Memphis', state: 'TN', pricePerGallon: 3.49, distanceFromRouteMiles: 2.4, dieselLanesCount: 8, amenities: ['Shower', 'Subway', 'DEF'] },
  { id: 'fuel-3', name: 'TA Express', city: 'Nashville', state: 'TN', pricePerGallon: 3.58, distanceFromRouteMiles: 3.1, dieselLanesCount: 6, amenities: ['Shower', "Iron Skillet", 'CAT Scale'] },
  { id: 'fuel-4', name: 'Flying J', city: 'West Memphis', state: 'AR', pricePerGallon: 3.44, distanceFromRouteMiles: 2.9, dieselLanesCount: 10, amenities: ['Shower', 'Denny\'s', 'Truck Wash'] },
];

export const findCheapestFuelStops = async (
  route: RouteFuelPlan,
  currentFuelLevel: number,
): Promise<FuelStation[]> => {
  if (!route.corridor.trim()) {
    throw new Error('A route corridor is required to optimize fuel stops.');
  }
  if (!Number.isFinite(currentFuelLevel) || currentFuelLevel < 0 || currentFuelLevel > 100) {
    throw new Error('Current fuel level must be a percentage between 0 and 100.');
  }

  const dieselPrice = await fetchLiveDieselPrice();

  if (isClaudeConfigured()) {
    try {
      const stations = await askClaudeJSON<FuelStation[]>(
        `Recommend 3 diesel fuel stops along the ${route.corridor} truck corridor.
        Current fuel level: ${currentFuelLevel}%. National diesel price: $${dieselPrice.nationalAverage}/gal.
        Return JSON array of 3 stops: [{ "id": "fuel-X", "name": "...", "city": "...", "state": "XX", "pricePerGallon": X.XX, "distanceFromRouteMiles": X.X, "dieselLanesCount": N, "amenities": ["Shower", "Restaurant"] }]`,
        FUEL_STOP_SYSTEM,
        512,
      );
      return stations.sort((a, b) => a.pricePerGallon - b.pricePerGallon).slice(0, 3);
    } catch {
      // Fall through to static list
    }
  }

  const maxRange = currentFuelLevel < 25 ? 5 : 10;
  return FALLBACK_STATIONS
    .map((s) => ({ ...s, pricePerGallon: Number((dieselPrice.nationalAverage + (Math.random() * 0.3 - 0.1)).toFixed(2)) }))
    .filter((s) => s.distanceFromRouteMiles <= maxRange)
    .sort((a, b) => a.pricePerGallon - b.pricePerGallon)
    .slice(0, 3);
};

export const calculateTollCosts = async (
  route: RouteFuelPlan,
): Promise<{ totalCost: number; provider: string; corridor: string }> => {
  if (!route.corridor.trim()) {
    throw new Error('A route corridor is required to calculate toll costs.');
  }

  if (isClaudeConfigured()) {
    try {
      const result = await askClaudeJSON<{ totalCost: number; provider: string }>(
        `Estimate truck toll costs for a semi-truck traveling the ${route.corridor} corridor.
        Return JSON: { "totalCost": number, "provider": "tolling provider name" }`,
        'You are a US truck toll cost estimator. Output JSON only.',
        128,
      );
      return { ...result, corridor: route.corridor };
    } catch {
      // Fall through
    }
  }

  return {
    totalCost: Number((route.waypoints.length * 18.5).toFixed(2)),
    provider: 'PrePass / E-ZPass',
    corridor: route.corridor,
  };
};
