// Dispatch Coordinator sub-task: anticipate next-day load options before the current
// route finishes, so the driver has a plan lined up the moment they deliver instead of
// sitting idle scanning the board. Distinct from general backhaul planning — this only
// surfaces loads whose pickup window actually lines up with this load's delivery date.

import { Load } from './workers-15x';

export const filterUpcomingLoads = (candidates: Load[], afterOrOnDateISO: string): Load[] => {
  const cutoff = new Date(afterOrOnDateISO).getTime();
  if (Number.isNaN(cutoff)) return candidates;

  return candidates.filter((load) => {
    const pickup = new Date(load.pickupDate).getTime();
    return !Number.isNaN(pickup) && pickup >= cutoff;
  });
};
