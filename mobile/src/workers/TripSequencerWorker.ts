// Dispatch Coordinator sub-task: sequence a multi-stop pickup/drop-off itinerary.
// Given a starting point and a set of stops, greedily orders them nearest-first so
// the driver isn't crossing their own path — a simple, explainable heuristic that's
// good enough for the handful of stops a real multi-stop load involves (not a full
// traveling-salesman solve, which isn't worth the complexity at this scale).

import { haversineDistanceMiles } from './BackhaulPlannerWorker';

export interface TripStop {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

export interface SequencedStop extends TripStop {
  legDistanceMiles: number;
}

export const sequenceStops = (
  start: { latitude: number; longitude: number },
  stops: TripStop[],
): SequencedStop[] => {
  const remaining = [...stops];
  const ordered: SequencedStop[] = [];
  let current = start;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((stop, index) => {
      const distance = haversineDistanceMiles(current, stop);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    const [next] = remaining.splice(nearestIndex, 1);
    ordered.push({ ...next, legDistanceMiles: nearestDistance });
    current = next;
  }

  return ordered;
};
