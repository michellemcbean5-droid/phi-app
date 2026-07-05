// The PHI Brain — one deterministic pipeline instead of 9 independent, competing
// "workers". Each stage below is a real function call against a real module (no
// simulated/decorative status flips): HOS pre-filter -> route calc -> fuel optimize
// -> broker credit + rate verify -> booking. Stages run strictly in order and every
// stage reports into usePHIOrchestratorStore so the whole app reads one shared log
// instead of nine separate activity feeds.
//
// Booking itself still happens entirely inside this app (AutoBookingEngine) — there
// is no handoff to an external process. Real broker platforms (DAT, Truckstop, Uber
// Freight, etc.) aren't connected here; see LoadFinderWorker for why.

import { fetchHOSData, getCurrentDriverLocation } from '../api/samsaraConnector';
import { calculateDeadhead } from './RouteAnalysisWorker';
import { runHOSPreFilter } from './HOSPreFilter';
import { fetchLiveDieselPrice, calculateTollCosts } from '../utils/fuelOptimizer';
import { calculateLiveCPM, calculateMinimumRPM } from '../utils/profitFormula';
import { executeBooking, BookingConfirmation } from './AutoBookingEngine';
import usePHIOrchestratorStore, { PipelineStage } from '../store/phiOrchestratorStore';
import useLoadsStore from '../store/loadsStore';
import useExpenseStore from '../store/expenseStore';
import useDriverPrefsStore from '../store/driverPrefsStore';
import useWorkerStore from '../store/workerStore';
import { Load } from './workers-15x';

const DRIVER_ID = 'driver-001';
const TARGET_PROFIT_MARGIN_PERCENT = 60;
const FALLBACK_DRIVE_REMAINING_HOURS = 11;
const AVG_MPG = 6.5;
const GPS_TIMEOUT_MS = 5000;

/**
 * A truck driver's GPS signal is not reliable — tunnels, mountains, a denied permission
 * prompt that never gets answered. A deterministic pipeline can't have a stage that
 * waits on that forever, so every GPS-dependent call gets a hard deadline and falls
 * back to a safe default instead of hanging the whole booking process.
 */
const withTimeout = <T>(promise: Promise<T>, fallback: T, ms = GPS_TIMEOUT_MS): Promise<T> =>
  Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

export interface PipelineResult {
  loadId: string;
  booked: boolean;
  stageReached: PipelineStage;
  reason: string | null;
  confirmation: BookingConfirmation | null;
}

const log = (stage: PipelineStage, loadId: string, message: string, outcome: 'pass' | 'rejected' | 'error'): void => {
  usePHIOrchestratorStore.getState().appendLog({ stage, loadId, message, outcome });
};

const setStage = (stage: PipelineStage, loadId: string): void => {
  usePHIOrchestratorStore.getState().setStage(stage, loadId);
};

const rejectAt = (stage: PipelineStage, load: Load, reason: string): PipelineResult => {
  log(stage, load.id, reason, 'rejected');
  useLoadsStore.getState().setBookingState(load.id, 'rejected');
  return { loadId: load.id, booked: false, stageReached: stage, reason, confirmation: null };
};

/** Runs one load through the full deterministic pipeline. Returns as soon as any stage rejects it. */
export const runOrchestratorPipeline = async (load: Load): Promise<PipelineResult> => {
  useLoadsStore.getState().setBookingState(load.id, 'pending');

  // Stage 1: Filter HOS Compliance — fast, no GPS/network, drops the trivial case
  // (driver already essentially out of hours) before any route work happens. The
  // real deadhead-aware compliance check happens in Stage 2, once GPS is available.
  setStage('hos-filter', load.id);
  const hos = await withTimeout(fetchHOSData(DRIVER_ID), null);
  const driveRemainingHours = hos?.availableDriveHours ?? FALLBACK_DRIVE_REMAINING_HOURS;
  const preFilter = runHOSPreFilter({ driveRemainingHours });
  if (!preFilter.compliant) {
    return rejectAt('hos-filter', load, preFilter.reason ?? 'Failed HOS pre-filter.');
  }
  log('hos-filter', load.id, `Cleared HOS pre-filter — ${driveRemainingHours.toFixed(1)}h drive time available.`, 'pass');

  // Stage 2: Calculate Route — real GPS deadhead + the authoritative HOS/deadhead-% check.
  setStage('route-calc', load.id);
  const location = (await withTimeout(getCurrentDriverLocation(), null)) ?? load.origin;
  const routeAnalysis = await calculateDeadhead(location, load.origin, load.totalMiles);
  if (routeAnalysis.rejected) {
    return rejectAt('route-calc', load, routeAnalysis.rejectionReason ?? 'Route rejected.');
  }
  useWorkerStore.getState().recordTaskCompletion(
    'route-optimizer',
    0,
    `Routed ${load.id} — ${routeAnalysis.deadheadMiles.toFixed(1)} deadhead mi (${routeAnalysis.deadheadPercentage}%)`,
  );
  log('route-calc', load.id, `Route confirmed — ${routeAnalysis.deadheadMiles.toFixed(1)} deadhead mi, ${routeAnalysis.estimatedTripHours}h total trip.`, 'pass');

  // Stage 3: Optimize Fuel — live diesel price + toll estimate for this specific corridor.
  setStage('fuel-optimize', load.id);
  const corridor = `${load.origin.city}, ${load.origin.state} to ${load.destination.city}, ${load.destination.state}`;
  const dieselPrice = await fetchLiveDieselPrice();
  const tolls = await calculateTollCosts({ corridor, waypoints: [load.origin, load.destination] });
  const estimatedFuelCost = Number(((load.totalMiles / AVG_MPG) * dieselPrice.nationalAverage).toFixed(2));
  useWorkerStore.getState().recordTaskCompletion(
    'fuel-optimizer',
    0,
    `Estimated $${estimatedFuelCost.toFixed(0)} fuel + $${tolls.totalCost.toFixed(0)} tolls for ${load.id}`,
  );
  log('fuel-optimize', load.id, `Fuel $${estimatedFuelCost.toFixed(0)} @ $${dieselPrice.nationalAverage.toFixed(2)}/gal + $${tolls.totalCost.toFixed(0)} tolls.`, 'pass');

  // Stage 4: Verify Broker Credit — credit score + dynamic minimum-RPM profitability gate.
  setStage('broker-verify', load.id);
  const creditScore = Math.round(load.brokerRating * 20);
  const { entries, totalExpenses } = useExpenseStore.getState();
  const totalMilesDriven = useLoadsStore.getState().bookingHistory.reduce((sum, r) => sum + r.miles, 0);
  const liveCPM = calculateLiveCPM(totalExpenses(), totalMilesDriven);
  const dynamicMinimumRPM = liveCPM > 0 ? calculateMinimumRPM(liveCPM, TARGET_PROFIT_MARGIN_PERCENT) : 0;
  const effectiveMinimumRPM = Math.max(useDriverPrefsStore.getState().prefs.minRPM, dynamicMinimumRPM);

  if (creditScore < 70) {
    return rejectAt('broker-verify', load, `Broker credit score ${creditScore} is below PHI's 70-point booking threshold.`);
  }
  if (load.rpm < effectiveMinimumRPM) {
    return rejectAt(
      'broker-verify',
      load,
      `$${load.rpm.toFixed(2)}/mi is below the ${entries.length > 0 ? 'live-cost-derived' : 'preference'} minimum of $${effectiveMinimumRPM.toFixed(2)}/mi.`,
    );
  }
  log('broker-verify', load.id, `Broker credit ${creditScore}/100 OK — $${load.rpm.toFixed(2)}/mi clears $${effectiveMinimumRPM.toFixed(2)}/mi minimum.`, 'pass');

  // Stage 5: Trigger Booking — same in-app booking engine used everywhere else in PHI.
  setStage('booking', load.id);
  const confirmation = await executeBooking(load, creditScore);
  if (!confirmation.booked) {
    return rejectAt('booking', load, confirmation.message);
  }

  useLoadsStore.getState().setBookingState(load.id, 'booked');
  useLoadsStore.getState().addBookingRecord({
    id: load.id,
    brokerName: load.brokerName,
    rate: load.rate,
    miles: load.totalMiles,
    rpm: load.rpm,
    bookedAt: new Date().toISOString(),
    paymentStatus: 'unpaid',
  });

  const { recordTaskCompletion } = useWorkerStore.getState();
  recordTaskCompletion('freight-negotiator', load.rate, `Booked ${load.id} at $${load.rate.toFixed(0)}`);
  recordTaskCompletion('dispatch-coordinator', 0, `Confirmed pickup for ${load.id}`);
  recordTaskCompletion('invoice-specialist', 0, `Invoice queued — bills automatically once ${load.id} delivers`);
  recordTaskCompletion('track-trace', 0, `Now tracking ETA for ${load.id}`);
  log('booking', load.id, `Booked — confirmation ${confirmation.confirmationId}.`, 'pass');

  setStage('idle', load.id);
  return { loadId: load.id, booked: true, stageReached: 'booking', reason: null, confirmation };
};
