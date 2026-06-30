// HOS tracking powered by expo-location (free, no account required).
// Uses real device GPS for location + timestamp-based drive time tracking.
// Federal HOS limits: 11-hour drive / 14-hour on-duty window.

import * as Location from 'expo-location';

export interface DriverAvailability {
  driverId: string;
  availableDriveHours: number;
  availableOnDutyHours: number;
  cycleHoursRemaining: number;
  status: 'available' | 'limited' | 'out-of-hours';
  lastUpdated: string;
  currentLocation?: { latitude: number; longitude: number; city?: string };
}

const MAX_DRIVE_HOURS = 11;
const MAX_ONDUTY_HOURS = 14;
const MAX_CYCLE_HOURS = 70;

const sessionRegistry: Record<string, number> = {};

export const clockInDriver = (driverId: string): void => {
  sessionRegistry[driverId] = Date.now();
};

const getElapsedHours = (driverId: string): number => {
  const start = sessionRegistry[driverId];
  if (!start) return 0;
  return (Date.now() - start) / (1000 * 60 * 60);
};

const requestLocationPermission = async (): Promise<boolean> => {
  const { status: existing } = await Location.getForegroundPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

export const getCurrentDriverLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  try {
    const granted = await requestLocationPermission();
    if (!granted) return null;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return null;
  }
};

export const fetchHOSData = async (driverId: string): Promise<DriverAvailability> => {
  if (!driverId.trim()) {
    throw new Error('Driver ID is required to fetch HOS data.');
  }

  if (!sessionRegistry[driverId]) {
    clockInDriver(driverId);
  }

  const elapsedHours = getElapsedHours(driverId);
  const availableDriveHours = Number(Math.max(0, MAX_DRIVE_HOURS - elapsedHours).toFixed(2));
  const availableOnDutyHours = Number(Math.max(0, MAX_ONDUTY_HOURS - elapsedHours).toFixed(2));
  const cycleHoursRemaining = Number(Math.max(0, MAX_CYCLE_HOURS - elapsedHours).toFixed(2));

  const status: DriverAvailability['status'] =
    availableDriveHours < 1
      ? 'out-of-hours'
      : availableDriveHours < 3
        ? 'limited'
        : 'available';

  let currentLocation: DriverAvailability['currentLocation'];
  try {
    const loc = await getCurrentDriverLocation();
    if (loc) {
      const [address] = await Location.reverseGeocodeAsync(loc);
      currentLocation = {
        ...loc,
        city: address ? `${address.city ?? ''}, ${address.region ?? ''}`.trim() : undefined,
      };
    }
  } catch {
    // Location not available — non-critical
  }

  return {
    driverId,
    availableDriveHours,
    availableOnDutyHours,
    cycleHoursRemaining,
    status,
    lastUpdated: new Date().toISOString(),
    currentLocation,
  };
};
