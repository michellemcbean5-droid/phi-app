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
}

const mockStations: FuelStation[] = [
  { id: 'fuel-1', name: 'Pilot Travel Center', city: 'Little Rock', state: 'AR', pricePerGallon: 3.62, distanceFromRouteMiles: 1.8 },
  { id: 'fuel-2', name: 'Love\'s Travel Stop', city: 'Memphis', state: 'TN', pricePerGallon: 3.49, distanceFromRouteMiles: 2.4 },
  { id: 'fuel-3', name: 'TA Express', city: 'Nashville', state: 'TN', pricePerGallon: 3.58, distanceFromRouteMiles: 3.1 },
  { id: 'fuel-4', name: 'Flying J', city: 'West Memphis', state: 'AR', pricePerGallon: 3.44, distanceFromRouteMiles: 2.9 },
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

  const preferredRange = currentFuelLevel < 25 ? 5 : 10;

  return mockStations
    .filter((station) => station.distanceFromRouteMiles <= preferredRange)
    .sort((left, right) => left.pricePerGallon - right.pricePerGallon)
    .slice(0, 3);
};

export const calculateTollCosts = async (
  route: RouteFuelPlan,
): Promise<{ totalCost: number; provider: string; corridor: string }> => {
  if (!route.corridor.trim()) {
    throw new Error('A route corridor is required to calculate toll costs.');
  }

  return {
    totalCost: Number((route.corridor.length * 2.35).toFixed(2)),
    provider: 'TollWhey Mock API',
    corridor: route.corridor,
  };
};
