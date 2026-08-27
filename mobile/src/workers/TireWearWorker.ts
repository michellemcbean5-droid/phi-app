// Fleet Maintenance sub-task: track tire wear patterns and schedule replacement before
// a tire goes below the legal minimum. FMCSA tread depth minimums are real, fixed
// numbers — 4/32" on steer axle tires, 2/32" on all other positions — not an estimate.
// Wear rate and miles-until-minimum are projected linearly between the driver's own
// two most recent tread readings for that position, the standard shop technique.

export type TirePosition =
  | 'Steer Left' | 'Steer Right'
  | 'Drive Left Outer' | 'Drive Left Inner' | 'Drive Right Outer' | 'Drive Right Inner'
  | 'Trailer';

export interface TireReading {
  position: TirePosition;
  treadDepth32nds: number;
  mileageAtReading: number;
  dateISO: string;
}

export interface TireWearStatus {
  position: TirePosition;
  latestTreadDepth32nds: number;
  minimumRequired32nds: number;
  belowMinimum: boolean;
  wearRatePer1000Miles: number | null;
  milesUntilMinimum: number | null;
}

const STEER_MIN_32NDS = 4;
const OTHER_MIN_32NDS = 2;

export const evaluateTireWear = (readings: TireReading[]): TireWearStatus[] => {
  const byPosition = new Map<TirePosition, TireReading[]>();
  readings.forEach((r) => {
    byPosition.set(r.position, [...(byPosition.get(r.position) ?? []), r]);
  });

  const results: TireWearStatus[] = [];

  byPosition.forEach((posReadings, position) => {
    const sorted = [...posReadings].sort((a, b) => a.mileageAtReading - b.mileageAtReading);
    const latest = sorted[sorted.length - 1];
    const minimumRequired32nds = position.startsWith('Steer') ? STEER_MIN_32NDS : OTHER_MIN_32NDS;
    const belowMinimum = latest.treadDepth32nds <= minimumRequired32nds;

    let wearRatePer1000Miles: number | null = null;
    let milesUntilMinimum: number | null = null;

    if (sorted.length >= 2) {
      const first = sorted[0];
      const mileageDelta = latest.mileageAtReading - first.mileageAtReading;
      const depthDelta = first.treadDepth32nds - latest.treadDepth32nds;

      if (mileageDelta > 0 && depthDelta > 0) {
        wearRatePer1000Miles = Number(((depthDelta / mileageDelta) * 1000).toFixed(3));
        const depthRemaining = latest.treadDepth32nds - minimumRequired32nds;
        milesUntilMinimum = depthRemaining > 0 ? Math.round((depthRemaining / depthDelta) * mileageDelta) : 0;
      }
    }

    results.push({ position, latestTreadDepth32nds: latest.treadDepth32nds, minimumRequired32nds, belowMinimum, wearRatePer1000Miles, milesUntilMinimum });
  });

  return results.sort((a, b) => (a.milesUntilMinimum ?? Infinity) - (b.milesUntilMinimum ?? Infinity));
};
