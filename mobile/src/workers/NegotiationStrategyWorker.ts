import { Load } from './workers-15x';

export const generateOutreachEmail = (
  load: Pick<Load, 'id' | 'origin' | 'destination' | 'rate' | 'rpm'>,
  marketCapacity: 'Tight' | 'Balanced' | 'Loose',
  laneDesirability: 'High' | 'Medium' | 'Low',
): string => {
  const targetRate = laneDesirability === 'High' ? load.rate * 1.06 : laneDesirability === 'Medium' ? load.rate * 1.03 : load.rate;
  const capacityNote =
    marketCapacity === 'Tight'
      ? 'capacity is especially constrained on this lane'
      : marketCapacity === 'Balanced'
        ? 'capacity is balanced but dependable execution still matters'
        : 'capacity is available, and we can move fast with clean communication';

  return [
    'Subject: PHI Capacity Available for Your Posted Dry Van Load',
    '',
    'Hello,',
    '',
    `Prince Haul Intelligence is reviewing load ${load.id} from ${load.origin.city}, ${load.origin.state} to ${load.destination.city}, ${load.destination.state}. Based on current conditions, ${capacityNote}.`,
    `Our team can support this move with a target all-in rate of $${targetRate.toFixed(2)} (${load.rpm.toFixed(2)} RPM baseline) while providing proactive updates and on-time execution.`,
    '',
    `Lane desirability is currently ${laneDesirability.toLowerCase()}, and we are prepared to confirm immediately if the rate aligns. Please let us know if this load is still available and whether we can finalize terms today.`,
    '',
    'Best regards,',
    'Prince Haul Intelligence Dispatch',
  ].join('\n');
};
