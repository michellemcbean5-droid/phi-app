import { describe, it, expect } from 'vitest';
import { calculateHOSClock, DutyStatusEvent } from '../workers/HOSClockWorker';

describe('calculateHOSClock', () => {
  it('returns full hours available with no duty-status history', () => {
    const result = calculateHOSClock([], new Date('2026-01-01T12:00:00.000Z'));
    expect(result.driveHoursUsed).toBe(0);
    expect(result.driveHoursRemaining).toBe(11);
    expect(result.onDutyWindowHoursRemaining).toBe(14);
    expect(result.breakRequired).toBe(false);
  });

  it('tracks drive hours and window hours through a normal day with a qualifying break', () => {
    const events: DutyStatusEvent[] = [
      { status: 'on-duty-not-driving', timestampISO: '2026-01-01T06:00:00.000Z' },
      { status: 'driving', timestampISO: '2026-01-01T07:00:00.000Z' },
      { status: 'off-duty', timestampISO: '2026-01-01T11:00:00.000Z' }, // 30 min break
      { status: 'driving', timestampISO: '2026-01-01T11:30:00.000Z' },
    ];
    const now = new Date('2026-01-01T15:30:00.000Z');
    const result = calculateHOSClock(events, now);
    expect(result.driveHoursUsed).toBe(8);
    expect(result.onDutyWindowHoursUsed).toBe(9.5);
    expect(result.hoursSinceLastQualifyingBreak).toBe(4);
    expect(result.breakRequired).toBe(false);
  });

  it('requires a break after 8 cumulative driving hours with no qualifying rest', () => {
    const events: DutyStatusEvent[] = [{ status: 'driving', timestampISO: '2026-01-01T05:00:00.000Z' }];
    const now = new Date('2026-01-01T14:00:00.000Z'); // 9h straight driving
    const result = calculateHOSClock(events, now);
    expect(result.driveHoursUsed).toBe(9);
    expect(result.hoursSinceLastQualifyingBreak).toBe(9);
    expect(result.breakRequired).toBe(true);
    expect(result.reason).toMatch(/30-minute break is required/);
  });

  it('a break under 30 minutes does not reset the break clock', () => {
    const events: DutyStatusEvent[] = [
      { status: 'driving', timestampISO: '2026-01-01T05:00:00.000Z' },
      { status: 'off-duty', timestampISO: '2026-01-01T09:00:00.000Z' }, // only 10 min
      { status: 'driving', timestampISO: '2026-01-01T09:10:00.000Z' },
    ];
    const now = new Date('2026-01-01T13:10:00.000Z'); // total drive: 4h + 4h = 8h
    const result = calculateHOSClock(events, now);
    expect(result.hoursSinceLastQualifyingBreak).toBe(8);
    expect(result.breakRequired).toBe(true);
  });

  it('resets the clock after a single continuous 10+ hour rest, excluding prior driving', () => {
    const events: DutyStatusEvent[] = [
      { status: 'driving', timestampISO: '2026-01-01T06:00:00.000Z' }, // 4h drive before rest
      { status: 'off-duty', timestampISO: '2026-01-01T10:00:00.000Z' }, // exactly 10h rest
      { status: 'driving', timestampISO: '2026-01-01T20:00:00.000Z' },
    ];
    const now = new Date('2026-01-01T22:00:00.000Z'); // 2h drive after reset
    const result = calculateHOSClock(events, now);
    expect(result.driveHoursUsed).toBe(2);
    expect(result.onDutyWindowHoursUsed).toBe(2);
    expect(result.breakRequired).toBe(false);
  });

  it('a 9-hour rest does NOT qualify as a reset (must be 10+)', () => {
    const events: DutyStatusEvent[] = [
      { status: 'driving', timestampISO: '2026-01-01T06:00:00.000Z' }, // 3h drive
      { status: 'off-duty', timestampISO: '2026-01-01T09:00:00.000Z' }, // 9h rest — insufficient
      { status: 'driving', timestampISO: '2026-01-01T18:00:00.000Z' },
    ];
    const now = new Date('2026-01-01T19:00:00.000Z'); // 1h drive after
    const result = calculateHOSClock(events, now);
    // No reset occurred, so drive hours accumulate across the whole history.
    expect(result.driveHoursUsed).toBe(4);
  });

  it('detects a qualifying split sleeper-berth pattern without silently recalculating a smaller window', () => {
    const events: DutyStatusEvent[] = [
      { status: 'driving', timestampISO: '2026-01-01T06:00:00.000Z' },
      { status: 'sleeper-berth', timestampISO: '2026-01-01T08:00:00.000Z' }, // 3h short leg
      { status: 'driving', timestampISO: '2026-01-01T11:00:00.000Z' },
      { status: 'sleeper-berth', timestampISO: '2026-01-01T13:00:00.000Z' }, // 7h long leg
      { status: 'driving', timestampISO: '2026-01-01T20:00:00.000Z' },
    ];
    const now = new Date('2026-01-01T21:00:00.000Z');
    const result = calculateHOSClock(events, now);
    expect(result.splitSleeperBerthDetected).toBe(true);
    expect(result.reason).toMatch(/split exception/);
    // Conservative: no single 10h+ rest occurred, so nothing resets — this must never
    // UNDERSTATE hours used (the dangerous direction), only ever potentially overstate them.
    expect(result.driveHoursUsed).toBe(5);
  });

  it('does not flag a split when the second leg is under 2 hours', () => {
    const events: DutyStatusEvent[] = [
      { status: 'driving', timestampISO: '2026-01-01T06:00:00.000Z' },
      { status: 'sleeper-berth', timestampISO: '2026-01-01T08:00:00.000Z' }, // only 1h
      { status: 'driving', timestampISO: '2026-01-01T09:00:00.000Z' },
      { status: 'sleeper-berth', timestampISO: '2026-01-01T11:00:00.000Z' }, // 7h long leg
      { status: 'driving', timestampISO: '2026-01-01T18:00:00.000Z' },
    ];
    const now = new Date('2026-01-01T19:00:00.000Z');
    const result = calculateHOSClock(events, now);
    expect(result.splitSleeperBerthDetected).toBe(false);
  });
});
