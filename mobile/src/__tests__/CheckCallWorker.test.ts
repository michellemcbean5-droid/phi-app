import { describe, it, expect } from 'vitest';
import { evaluateCheckCallStatus } from '../workers/CheckCallWorker';

describe('evaluateCheckCallStatus', () => {
  it('reports not in transit once the load has been delivered', () => {
    const result = evaluateCheckCallStatus({
      bookedAtISO: '2026-01-01T06:00:00.000Z',
      deliveredAtISO: '2026-01-01T12:00:00.000Z',
      checkCallLog: [],
      intervalHours: 4,
    });
    expect(result.inTransit).toBe(false);
    expect(result.isDue).toBe(false);
  });

  it('is not due before the interval has elapsed since booking', () => {
    const result = evaluateCheckCallStatus(
      { bookedAtISO: '2026-01-01T06:00:00.000Z', deliveredAtISO: null, checkCallLog: [], intervalHours: 4 },
      new Date('2026-01-01T08:00:00.000Z'),
    );
    expect(result.inTransit).toBe(true);
    expect(result.isDue).toBe(false);
    expect(result.nextCheckCallDueISO).toBe('2026-01-01T10:00:00.000Z');
  });

  it('is due once the interval has elapsed since booking with no prior check call', () => {
    const result = evaluateCheckCallStatus(
      { bookedAtISO: '2026-01-01T06:00:00.000Z', deliveredAtISO: null, checkCallLog: [], intervalHours: 4 },
      new Date('2026-01-01T10:30:00.000Z'),
    );
    expect(result.isDue).toBe(true);
  });

  it('resets the due window from the most recent check call, not the booking time', () => {
    const result = evaluateCheckCallStatus(
      {
        bookedAtISO: '2026-01-01T06:00:00.000Z',
        deliveredAtISO: null,
        checkCallLog: ['2026-01-01T09:00:00.000Z'],
        intervalHours: 4,
      },
      new Date('2026-01-01T11:00:00.000Z'),
    );
    expect(result.lastCheckCallISO).toBe('2026-01-01T09:00:00.000Z');
    expect(result.nextCheckCallDueISO).toBe('2026-01-01T13:00:00.000Z');
    expect(result.isDue).toBe(false);
  });

  it('uses the most recent check call even if the log is unsorted', () => {
    const result = evaluateCheckCallStatus(
      {
        bookedAtISO: '2026-01-01T06:00:00.000Z',
        deliveredAtISO: null,
        checkCallLog: ['2026-01-01T09:00:00.000Z', '2026-01-01T07:00:00.000Z'],
        intervalHours: 4,
      },
      new Date('2026-01-01T10:00:00.000Z'),
    );
    expect(result.lastCheckCallISO).toBe('2026-01-01T09:00:00.000Z');
  });
});
