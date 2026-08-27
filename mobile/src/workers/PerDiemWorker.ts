// IFTA & Tax sub-task: calculate per diem meal-allowance (M&IE) tax deductions. A
// self-employed owner-operator can deduct a percentage of the standard per diem rate
// for each day away from home on business — this is an estimate to hand to a CPA, not
// a filed return, and the rate/percentage are configurable since they change by tax
// year and the driver should confirm the current figures with their accountant.

import { BookedLoadRecord } from '../store/loadsStore';

export interface PerDiemResult {
  daysOnRoad: number;
  dailyRate: number;
  grossPerDiem: number;
  deductiblePercent: number;
  deductibleAmount: number;
}

export const calculatePerDiem = (daysOnRoad: number, dailyRate: number, deductiblePercent: number): PerDiemResult => {
  const grossPerDiem = Number((Math.max(0, daysOnRoad) * dailyRate).toFixed(2));
  const deductibleAmount = Number((grossPerDiem * (deductiblePercent / 100)).toFixed(2));
  return { daysOnRoad: Math.max(0, daysOnRoad), dailyRate, grossPerDiem, deductiblePercent, deductibleAmount };
};

/**
 * Counts unique calendar days that have at least one logged gate check-in/out event
 * across all booked loads — a real, driver-logged floor on "days on the road," not a
 * fabricated estimate. This will undercount total days away from home for anyone who
 * hasn't logged every stop; it's a starting point to adjust, not a final figure.
 */
export const countLoggedDaysOnRoad = (bookingHistory: BookedLoadRecord[]): number => {
  const days = new Set<string>();
  bookingHistory.forEach((record) => {
    Object.values(record.gateTimes ?? {}).forEach((timestamp) => {
      if (timestamp) days.add(new Date(timestamp).toISOString().split('T')[0]);
    });
  });
  return days.size;
};
