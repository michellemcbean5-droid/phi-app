import { describe, it, expect } from 'vitest';
import { calculateDetention, summarizeLoadDetention } from '../workers/DetentionTrackerWorker';

describe('calculateDetention', () => {
  it('returns incomplete when check-out is missing', () => {
    const result = calculateDetention('2026-01-01T10:00:00.000Z', undefined, 2, 50);
    expect(result.isComplete).toBe(false);
    expect(result.detentionOwed).toBe(0);
  });

  it('charges nothing within free time', () => {
    const result = calculateDetention(
      '2026-01-01T10:00:00.000Z',
      '2026-01-01T11:30:00.000Z',
      2,
      50,
    );
    expect(result.totalMinutesOnSite).toBe(90);
    expect(result.detentionMinutes).toBe(0);
    expect(result.detentionOwed).toBe(0);
  });

  it('charges detention for time beyond the free window', () => {
    const result = calculateDetention(
      '2026-01-01T10:00:00.000Z',
      '2026-01-01T13:00:00.000Z',
      2,
      50,
    );
    expect(result.totalMinutesOnSite).toBe(180);
    expect(result.detentionMinutes).toBe(60);
    expect(result.detentionOwed).toBe(50);
  });

  it('handles fractional hourly rates correctly', () => {
    const result = calculateDetention(
      '2026-01-01T10:00:00.000Z',
      '2026-01-01T12:45:00.000Z',
      2,
      60,
    );
    expect(result.detentionMinutes).toBe(45);
    expect(result.detentionOwed).toBe(45);
  });
});

describe('summarizeLoadDetention', () => {
  it('sums detention owed across pickup and delivery', () => {
    const summary = summarizeLoadDetention(
      {
        pickupCheckIn: '2026-01-01T08:00:00.000Z',
        pickupCheckOut: '2026-01-01T11:00:00.000Z',
        deliveryCheckIn: '2026-01-02T08:00:00.000Z',
        deliveryCheckOut: '2026-01-02T09:30:00.000Z',
      },
      2,
      50,
    );
    expect(summary.stops).toHaveLength(2);
    expect(summary.stops[0].result.detentionOwed).toBe(50);
    expect(summary.stops[1].result.detentionOwed).toBe(0);
    expect(summary.totalDetentionOwed).toBe(50);
  });

  it('returns zero owed with no gate times logged', () => {
    const summary = summarizeLoadDetention({}, 2, 50);
    expect(summary.totalDetentionOwed).toBe(0);
  });
});
