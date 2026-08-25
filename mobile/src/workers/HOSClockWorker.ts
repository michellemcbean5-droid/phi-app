// Compliance & Safety sub-tasks: monitor duty-status history to alert the driver to
// required rest breaks (task 14), and flag when the FMCSA split sleeper-berth exception
// is in play so drive-time math doesn't silently understate what's actually used (task 19).
//
// This is deliberately a self-contained, pure rule engine over a duty-status log — it
// does not replace HOSPreFilter (a cheap booking-time sanity gate) or fetchHOSData (the
// simulated ELD feed). It answers a different question: given today's actual duty-status
// changes, is a 30-minute break required right now, and how much of the 11-hour drive /
// 14-hour on-duty window is left.
//
// Split sleeper berth is one of the most misapplied rules in FMCSA HOS — even compliance
// professionals get the paired 7/8 + 2/3 recalculation wrong. Rather than asserting a
// specific recalculated number that could be subtly incorrect on a genuinely complex rule,
// this worker computes the clock using ONLY the unambiguous single 10-hour reset (which is
// always correct and, if anything, UNDERSTATES remaining hours when a split was actually
// used — the safe direction to be wrong in) and separately flags when a qualifying split
// pattern is detected, so the driver knows to verify the real number against their ELD.

export type DutyStatus = 'driving' | 'on-duty-not-driving' | 'off-duty' | 'sleeper-berth';

export interface DutyStatusEvent {
  status: DutyStatus;
  timestampISO: string;
}

export interface HOSClockResult {
  driveHoursUsed: number;
  driveHoursRemaining: number;
  onDutyWindowHoursUsed: number;
  onDutyWindowHoursRemaining: number;
  hoursSinceLastQualifyingBreak: number;
  breakRequired: boolean;
  splitSleeperBerthDetected: boolean;
  reason: string | null;
}

const DRIVE_LIMIT_HOURS = 11;
const ON_DUTY_WINDOW_HOURS = 14;
const BREAK_REQUIRED_AFTER_DRIVE_HOURS = 8;
const MIN_BREAK_MINUTES = 30;
const RESET_OFF_DUTY_HOURS = 10;
const SPLIT_LONG_LEG_MIN_HOURS = 7;
const SPLIT_SHORT_LEG_MIN_HOURS = 2;

const restStatuses: DutyStatus[] = ['off-duty', 'sleeper-berth'];
const hoursBetween = (aISO: string, bISO: string): number => (new Date(bISO).getTime() - new Date(aISO).getTime()) / 3600000;

interface Segment {
  status: DutyStatus;
  startISO: string;
  endISO: string;
  hours: number;
}

const toSegments = (events: DutyStatusEvent[], nowISO: string): Segment[] => {
  const sorted = [...events].sort((a, b) => new Date(a.timestampISO).getTime() - new Date(b.timestampISO).getTime());
  return sorted.map((event, index) => {
    const endISO = index + 1 < sorted.length ? sorted[index + 1].timestampISO : nowISO;
    return { status: event.status, startISO: event.timestampISO, endISO, hours: hoursBetween(event.timestampISO, endISO) };
  });
};

/** The only unambiguous reset: one continuous rest segment of 10+ hours. Returns the
 * index of the first segment that counts toward the current on-duty window. */
const findResetIndex = (segments: Segment[]): number => {
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (restStatuses.includes(segments[i].status) && segments[i].hours >= RESET_OFF_DUTY_HOURS) {
      return i + 1;
    }
  }
  return 0;
};

/** Detects (without recalculating around) a qualifying split sleeper-berth pattern:
 * a sleeper-berth leg >= 7h paired with any other rest leg >= 2h. */
const detectSplitSleeperBerth = (segments: Segment[]): boolean => {
  const longLegs = segments.filter((s) => s.status === 'sleeper-berth' && s.hours >= SPLIT_LONG_LEG_MIN_HOURS);
  if (longLegs.length === 0) return false;
  return segments.some((s) => restStatuses.includes(s.status) && s.hours >= SPLIT_SHORT_LEG_MIN_HOURS && !longLegs.includes(s));
};

export const calculateHOSClock = (events: DutyStatusEvent[], now: Date = new Date()): HOSClockResult => {
  if (events.length === 0) {
    return {
      driveHoursUsed: 0,
      driveHoursRemaining: DRIVE_LIMIT_HOURS,
      onDutyWindowHoursUsed: 0,
      onDutyWindowHoursRemaining: ON_DUTY_WINDOW_HOURS,
      hoursSinceLastQualifyingBreak: 0,
      breakRequired: false,
      splitSleeperBerthDetected: false,
      reason: null,
    };
  }

  const nowISO = now.toISOString();
  const segments = toSegments(events, nowISO);
  const resetIndex = findResetIndex(segments);
  const activeSegments = segments.slice(resetIndex);

  const driveHoursUsed = Number(activeSegments.filter((s) => s.status === 'driving').reduce((sum, s) => sum + s.hours, 0).toFixed(2));
  const onDutyWindowHoursUsed = Number(activeSegments.reduce((sum, s) => sum + s.hours, 0).toFixed(2));

  // 30-minute break rule: cumulative drive time since the last rest segment of >= 30 min.
  let hoursSinceLastQualifyingBreak = 0;
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const seg = segments[i];
    if (restStatuses.includes(seg.status) && seg.hours * 60 >= MIN_BREAK_MINUTES) break;
    if (seg.status === 'driving') hoursSinceLastQualifyingBreak += seg.hours;
  }
  hoursSinceLastQualifyingBreak = Number(hoursSinceLastQualifyingBreak.toFixed(2));

  const driveHoursRemaining = Number(Math.max(0, DRIVE_LIMIT_HOURS - driveHoursUsed).toFixed(2));
  const onDutyWindowHoursRemaining = Number(Math.max(0, ON_DUTY_WINDOW_HOURS - onDutyWindowHoursUsed).toFixed(2));
  const breakRequired = hoursSinceLastQualifyingBreak >= BREAK_REQUIRED_AFTER_DRIVE_HOURS;
  const splitSleeperBerthDetected = detectSplitSleeperBerth(activeSegments);

  const reasons: string[] = [];
  if (breakRequired) reasons.push(`${hoursSinceLastQualifyingBreak}h driven since last qualifying break — a 30-minute break is required before driving further.`);
  if (driveHoursRemaining <= 0) reasons.push('11-hour drive limit reached.');
  if (onDutyWindowHoursRemaining <= 0) reasons.push('14-hour on-duty window expired.');
  if (splitSleeperBerthDetected) {
    reasons.push('Split sleeper-berth pattern detected — this estimate does not apply the split exception recalculation, so your real remaining hours may be higher than shown. Verify against your ELD.');
  }

  return {
    driveHoursUsed,
    driveHoursRemaining,
    onDutyWindowHoursUsed,
    onDutyWindowHoursRemaining,
    hoursSinceLastQualifyingBreak,
    breakRequired,
    splitSleeperBerthDetected,
    reason: reasons.length > 0 ? reasons.join(' ') : null,
  };
};
