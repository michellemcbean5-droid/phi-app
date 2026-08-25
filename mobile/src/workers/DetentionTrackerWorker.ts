// Dispatch Coordinator sub-task: track facility gate wait times and turn them into
// billable detention pay. Brokers typically owe detention after a fixed amount of free
// time at a shipper/receiver (industry standard ~2 hours) — this worker measures the
// gap between gate check-in and check-out and calculates what's actually owed.

export type GateEvent = 'pickupCheckIn' | 'pickupCheckOut' | 'deliveryCheckIn' | 'deliveryCheckOut';

export interface DetentionResult {
  totalMinutesOnSite: number;
  freeMinutes: number;
  detentionMinutes: number;
  detentionOwed: number;
  isComplete: boolean;
}

export const calculateDetention = (
  checkInISO: string | undefined,
  checkOutISO: string | undefined,
  freeTimeHours: number,
  detentionRatePerHour: number,
): DetentionResult => {
  if (!checkInISO || !checkOutISO) {
    return { totalMinutesOnSite: 0, freeMinutes: freeTimeHours * 60, detentionMinutes: 0, detentionOwed: 0, isComplete: false };
  }

  const checkInMs = new Date(checkInISO).getTime();
  const checkOutMs = new Date(checkOutISO).getTime();
  const totalMinutesOnSite = Math.max(0, Math.round((checkOutMs - checkInMs) / 60000));
  const freeMinutes = freeTimeHours * 60;
  const detentionMinutes = Math.max(0, totalMinutesOnSite - freeMinutes);
  const detentionOwed = Number(((detentionMinutes / 60) * detentionRatePerHour).toFixed(2));

  return { totalMinutesOnSite, freeMinutes, detentionMinutes, detentionOwed, isComplete: true };
};

export interface StopDetention {
  stop: 'pickup' | 'delivery';
  result: DetentionResult;
}

export const summarizeLoadDetention = (
  gateTimes: Partial<Record<GateEvent, string>>,
  freeTimeHours: number,
  detentionRatePerHour: number,
): { stops: StopDetention[]; totalDetentionOwed: number } => {
  const pickup = calculateDetention(gateTimes.pickupCheckIn, gateTimes.pickupCheckOut, freeTimeHours, detentionRatePerHour);
  const delivery = calculateDetention(gateTimes.deliveryCheckIn, gateTimes.deliveryCheckOut, freeTimeHours, detentionRatePerHour);

  const stops: StopDetention[] = [
    { stop: 'pickup', result: pickup },
    { stop: 'delivery', result: delivery },
  ];

  return {
    stops,
    totalDetentionOwed: Number((pickup.detentionOwed + delivery.detentionOwed).toFixed(2)),
  };
};
