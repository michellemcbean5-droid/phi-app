// Freight Procurement sub-task: identify and flag loads that look double-brokered so
// the driver can verify with the shipper before committing. This is heuristic pattern
// detection over the load board data actually available — not a verified fraud
// determination and not a substitute for calling the shipper or checking FMCSA's SAFER
// database. It flags for review; it never blocks a booking outright.

import { Load } from './workers-15x';

export interface FraudFlag {
  loadId: string;
  severity: 'high' | 'medium';
  reason: string;
}

const BAIT_RATE_RATING_THRESHOLD = 3.0;
const BAIT_RATE_MULTIPLIER = 1.3;

const laneSignature = (load: Load): string =>
  `${load.origin.city}|${load.origin.state}|${load.destination.city}|${load.destination.state}|${load.pickupDate}`;

export const detectDoubleBrokeredLoads = (loads: Load[]): FraudFlag[] => {
  const flags: FraudFlag[] = [];

  const bySignature = new Map<string, Load[]>();
  loads.forEach((load) => {
    const sig = laneSignature(load);
    bySignature.set(sig, [...(bySignature.get(sig) ?? []), load]);
  });

  bySignature.forEach((group) => {
    const uniqueBrokers = new Set(group.map((l) => l.brokerName));
    if (group.length > 1 && uniqueBrokers.size > 1) {
      group.forEach((load) => {
        flags.push({
          loadId: load.id,
          severity: 'high',
          reason: `Same lane and pickup date (${load.origin.city}, ${load.origin.state} → ${load.destination.city}, ${load.destination.state} on ${load.pickupDate}) is posted by ${uniqueBrokers.size} different brokers (${[...uniqueBrokers].join(', ')}) — a common double-brokering pattern. Verify directly with the shipper before booking.`,
        });
      });
    }
  });

  if (loads.length > 0) {
    const avgRPM = loads.reduce((sum, l) => sum + l.rpm, 0) / loads.length;
    loads.forEach((load) => {
      if (load.brokerRating < BAIT_RATE_RATING_THRESHOLD && load.rpm > avgRPM * BAIT_RATE_MULTIPLIER) {
        flags.push({
          loadId: load.id,
          severity: 'medium',
          reason: `Broker rating is only ${load.brokerRating.toFixed(1)}/5 but this pays ${(load.rpm / avgRPM).toFixed(1)}x the board average RPM — a common bait-rate pattern used to lure carriers into fraudulent or double-brokered loads. Verify the broker's authority before booking.`,
        });
      }
    });
  }

  return flags;
};
