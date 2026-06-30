// Routing via OpenRouteService (free tier: 2,000 req/day — openrouteservice.org)
// Falls back to haversine formula when EXPO_PUBLIC_ORS_API_KEY is not set.

const ORS_BASE = 'https://api.openrouteservice.org/v2';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RouteWaypoint {
  name: string;
  coordinates: Coordinates;
}

export interface DistanceMatrixResult {
  distanceMiles: number;
  durationMinutes: number;
  source: 'openrouteservice' | 'haversine';
}

const EARTH_RADIUS_MILES = 3958.8;
const toRadians = (deg: number): number => (deg * Math.PI) / 180;

const haversineMiles = (origin: Coordinates, destination: Coordinates): number => {
  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLon = toRadians(destination.longitude - origin.longitude);
  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(destination.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const haversineMatrix = (origin: Coordinates, destination: Coordinates): DistanceMatrixResult => {
  const directMiles = haversineMiles(origin, destination);
  const distanceMiles = Number((directMiles * 1.12).toFixed(2));
  return {
    distanceMiles,
    durationMinutes: Math.round((distanceMiles / 55) * 60),
    source: 'haversine',
  };
};

export const fetchDistanceMatrix = async (
  origin: Coordinates,
  destination: Coordinates,
): Promise<DistanceMatrixResult> => {
  const key = process.env.EXPO_PUBLIC_ORS_API_KEY ?? '';
  if (!key) return haversineMatrix(origin, destination);

  try {
    const response = await fetch(`${ORS_BASE}/matrix/driving-hgv`, {
      method: 'POST',
      headers: {
        Authorization: key,
        'Content-Type': 'application/json',
        Accept: 'application/json, application/geo+json',
      },
      body: JSON.stringify({
        locations: [
          [origin.longitude, origin.latitude],
          [destination.longitude, destination.latitude],
        ],
        metrics: ['distance', 'duration'],
        units: 'mi',
      }),
    });

    if (!response.ok) throw new Error(`ORS ${response.status}`);

    const data = await response.json() as {
      distances: number[][];
      durations: number[][];
    };

    return {
      distanceMiles: Number(data.distances[0][1].toFixed(2)),
      durationMinutes: Math.round(data.durations[0][1] / 60),
      source: 'openrouteservice',
    };
  } catch {
    return haversineMatrix(origin, destination);
  }
};

export const calculateMultiStopRoute = async (
  waypoints: RouteWaypoint[],
): Promise<{ totalMiles: number; totalMinutes: number }> => {
  if (waypoints.length < 2) {
    throw new Error('At least two waypoints are required for a route.');
  }

  let totalMiles = 0;
  let totalMinutes = 0;

  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const leg = await fetchDistanceMatrix(waypoints[i].coordinates, waypoints[i + 1].coordinates);
    totalMiles += leg.distanceMiles;
    totalMinutes += leg.durationMinutes;
  }

  return { totalMiles: Number(totalMiles.toFixed(2)), totalMinutes };
};

export const calculateGPSDeadhead = async (
  currentLocation: Coordinates,
  pickupLocation: Coordinates,
): Promise<number> => {
  const { distanceMiles } = await fetchDistanceMatrix(currentLocation, pickupLocation);
  return distanceMiles;
};
