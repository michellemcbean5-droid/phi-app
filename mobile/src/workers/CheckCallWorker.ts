// Dispatch Coordinator sub-task: automate recurring broker location/status updates
// ("check calls") for loads that are booked and in transit, so the driver isn't the
// one remembering to call the broker every few hours with a status update.

export interface CheckCallInput {
  bookedAtISO: string;
  deliveredAtISO: string | null;
  checkCallLog: string[];
  intervalHours: number;
}

export interface CheckCallStatus {
  inTransit: boolean;
  lastCheckCallISO: string | null;
  nextCheckCallDueISO: string | null;
  isDue: boolean;
}

export const evaluateCheckCallStatus = (input: CheckCallInput, now: Date = new Date()): CheckCallStatus => {
  if (input.deliveredAtISO) {
    return { inTransit: false, lastCheckCallISO: null, nextCheckCallDueISO: null, isDue: false };
  }

  const sorted = [...input.checkCallLog].sort();
  const lastCheckCallISO = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const baselineISO = lastCheckCallISO ?? input.bookedAtISO;
  const nextCheckCallDueISO = new Date(new Date(baselineISO).getTime() + input.intervalHours * 3600000).toISOString();
  const isDue = now.getTime() >= new Date(nextCheckCallDueISO).getTime();

  return { inTransit: true, lastCheckCallISO, nextCheckCallDueISO, isDue };
};
