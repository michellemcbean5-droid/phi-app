// Dispatch Coordinator sub-task: balance a driver's requested home-time schedule
// against high-paying lane opportunities. A load that gets the driver home on time
// is always fine; a load that would blow past the home-time target is only worth
// taking when it pays enough above the driver's normal floor to justify the delay.

import { Load } from './workers-15x';

export type HomeTimeRecommendation = 'take' | 'take-if-premium' | 'skip-delays-home-time';

export interface HomeTimeEvaluation {
  meetsHomeTime: boolean;
  daysPastHomeTarget: number;
  rpmPremiumPercent: number;
  recommendation: HomeTimeRecommendation;
}

export const evaluateHomeTimeFit = (
  load: Load,
  homeTimeTargetDateISO: string | null,
  minRPM: number,
  premiumThresholdPercent: number,
): HomeTimeEvaluation => {
  if (!homeTimeTargetDateISO) {
    return { meetsHomeTime: true, daysPastHomeTarget: 0, rpmPremiumPercent: 0, recommendation: 'take' };
  }

  const deliveryMs = new Date(load.deliveryDate).getTime();
  const targetMs = new Date(homeTimeTargetDateISO).getTime();
  const meetsHomeTime = deliveryMs <= targetMs;
  const daysPastHomeTarget = meetsHomeTime ? 0 : Math.ceil((deliveryMs - targetMs) / 86400000);
  const rpmPremiumPercent = minRPM > 0 ? Number((((load.rpm - minRPM) / minRPM) * 100).toFixed(1)) : 0;

  if (meetsHomeTime) {
    return { meetsHomeTime, daysPastHomeTarget, rpmPremiumPercent, recommendation: 'take' };
  }

  return {
    meetsHomeTime,
    daysPastHomeTarget,
    rpmPremiumPercent,
    recommendation: rpmPremiumPercent >= premiumThresholdPercent ? 'take-if-premium' : 'skip-delays-home-time',
  };
};
