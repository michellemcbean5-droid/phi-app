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
}

const EARTH_RADIUS_MILES = 3958.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const haversineMiles = (origin: Coordinates, destination: Coordinates): number => {
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const latitude1 = toRadians(origin.latitude);
  const latitude2 = toRadians(destination.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
};

export const fetchDistanceMatrix = async (
  origin: Coordinates,
  destination: Coordinates,
): Promise<DistanceMatrixResult> => {
  const directMiles = haversineMiles(origin, destination);
  const distanceMiles = Number((directMiles * 1.12).toFixed(2));

  return {
    distanceMiles,
    durationMinutes: Math.round((distanceMiles / 55) * 60),
  };
};

export const calculateMultiStopRoute = async (
  waypoints: RouteWaypoint[],
): Promise<{ totalMiles: number; totalMinutes: number }> => {
  if (waypoints.length < 2) {
    throw new Error('At least two waypoints are required for a route.');
  }

  let totalMiles = 0;
  let totalMinutes = 0;

  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const leg = await fetchDistanceMatrix(waypoints[index].coordinates, waypoints[index + 1].coordinates);
    totalMiles += leg.distanceMiles;
    totalMinutes += leg.durationMinutes;
  }

  return {
    totalMiles: Number(totalMiles.toFixed(2)),
    totalMinutes,
  };
};

export const calculateGPSDeadhead = async (
  currentLocation: Coordinates,
  pickupLocation: Coordinates,
): Promise<number> => {
  const { distanceMiles } = await fetchDistanceMatrix(currentLocation, pickupLocation);
  return distanceMiles;
};
