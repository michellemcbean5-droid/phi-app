// Dispatch Coordinator sub-task: plan profitable backhauls so the truck never runs
// empty on the return leg. Scores candidate loads by how close their origin is to
// where the driver is about to drop off, weighted against the rate they pay —
// a close, well-paying backhaul beats a far, slightly-better-paying one.

import { Load } from './workers-15x';

interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_MILES = 3958.8;
const toRadians = (deg: number): number => (deg * Math.PI) / 180;

export const haversineDistanceMiles = (a: LatLng, b: LatLng): number => {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Number((EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))).toFixed(2));
};

export interface BackhaulSuggestion {
  load: Load;
  distanceFromDropMiles: number;
  score: number;
}

export interface BackhaulOptions {
  maxOriginDistanceMiles: number;
  minRPM: number;
  /** RPM-equivalent penalty per 100 miles of deadhead to reach the backhaul's origin. */
  deadheadPenaltyPer100Miles: number;
}

export const DEFAULT_BACKHAUL_OPTIONS: BackhaulOptions = {
  maxOriginDistanceMiles: 75,
  minRPM: 0,
  deadheadPenaltyPer100Miles: 1,
};

export const findBackhauls = (
  dropLocation: LatLng,
  candidates: Load[],
  currentLoadId: string,
  options: Partial<BackhaulOptions> = {},
): BackhaulSuggestion[] => {
  const opts = { ...DEFAULT_BACKHAUL_OPTIONS, ...options };

  return candidates
    .filter((load) => load.id !== currentLoadId)
    .map((load) => {
      const distanceFromDropMiles = haversineDistanceMiles(dropLocation, load.origin);
      const score = Number((load.rpm - (distanceFromDropMiles / 100) * opts.deadheadPenaltyPer100Miles).toFixed(3));
      return { load, distanceFromDropMiles, score };
    })
    .filter((s) => s.distanceFromDropMiles <= opts.maxOriginDistanceMiles && s.load.rpm >= opts.minRPM)
    .sort((a, b) => b.score - a.score);
};
