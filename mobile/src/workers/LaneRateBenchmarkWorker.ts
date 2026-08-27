// Freight Procurement sub-task: benchmark a load's rate against the board's own
// current average for the same equipment type. Real DAT/Truckstop-style "7-day
// national lane average" data isn't available here — only today's board — so this
// is honestly labeled as a same-day board comparison, not a fabricated national
// average.

import { Load } from './workers-15x';

export type RateClassification = 'above-market' | 'at-market' | 'below-market';

export interface LaneBenchmark {
  loadRPM: number;
  boardAverageRPM: number;
  percentVsAverage: number;
  classification: RateClassification;
  sampleSize: number;
}

const MARKET_BAND_PERCENT = 10;

export const benchmarkLoadRate = (load: Load, boardLoads: Load[]): LaneBenchmark => {
  const comparable = boardLoads.filter((l) => l.equipmentType === load.equipmentType);
  const sampleSize = comparable.length;

  if (sampleSize === 0) {
    return { loadRPM: load.rpm, boardAverageRPM: load.rpm, percentVsAverage: 0, classification: 'at-market', sampleSize: 0 };
  }

  const boardAverageRPM = Number((comparable.reduce((sum, l) => sum + l.rpm, 0) / sampleSize).toFixed(2));
  const percentVsAverage = boardAverageRPM > 0 ? Number((((load.rpm - boardAverageRPM) / boardAverageRPM) * 100).toFixed(1)) : 0;

  const classification: RateClassification =
    percentVsAverage >= MARKET_BAND_PERCENT ? 'above-market' : percentVsAverage <= -MARKET_BAND_PERCENT ? 'below-market' : 'at-market';

  return { loadRPM: load.rpm, boardAverageRPM, percentVsAverage, classification, sampleSize };
};
