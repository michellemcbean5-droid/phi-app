// Pure, deterministic HOS pre-check — no AI call, no network, no GPS. Runs first in
// the orchestrator pipeline as a cheap sanity gate before any route/GPS work happens.
//
// It deliberately does NOT estimate whether the whole loaded haul fits in today's
// remaining hours — a multi-day OTR run (800+ miles with a required rest reset)
// is completely normal freight, not an HOS violation. Only the deadhead leg to
// reach pickup has to fit in today's clock, and that requires real GPS distance,
// which isn't known yet at this stage — Stage 2 (RouteAnalysisWorker.calculateDeadhead)
// is the authoritative check for that once the real deadhead miles are in hand.
// This pre-filter only catches the trivial case: a driver with no meaningful hours
// left today shouldn't even be offered a new pickup to head toward.

export interface HOSPreFilterInput {
  driveRemainingHours: number;
  minimumDriveHoursRequired?: number;
}

export interface HOSPreFilterResult {
  compliant: boolean;
  driveRemainingHours: number;
  reason: string | null;
}

const DEFAULT_MINIMUM_DRIVE_HOURS_REQUIRED = 1;

export const runHOSPreFilter = (input: HOSPreFilterInput): HOSPreFilterResult => {
  if (!Number.isFinite(input.driveRemainingHours) || input.driveRemainingHours < 0) {
    throw new Error('driveRemainingHours must be a non-negative number.');
  }

  const minimumRequired = input.minimumDriveHoursRequired ?? DEFAULT_MINIMUM_DRIVE_HOURS_REQUIRED;
  if (!Number.isFinite(minimumRequired) || minimumRequired < 0) {
    throw new Error('minimumDriveHoursRequired must be a non-negative number.');
  }

  const compliant = input.driveRemainingHours >= minimumRequired;

  return {
    compliant,
    driveRemainingHours: input.driveRemainingHours,
    reason: compliant
      ? null
      : `Only ${input.driveRemainingHours.toFixed(1)}h drive time left today — below the ${minimumRequired}h minimum needed to head toward a new pickup.`,
  };
};
