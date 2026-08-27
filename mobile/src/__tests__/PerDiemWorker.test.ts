import { describe, it, expect } from 'vitest';
import { calculatePerDiem, countLoggedDaysOnRoad } from '../workers/PerDiemWorker';
import { BookedLoadRecord } from '../store/loadsStore';

describe('calculatePerDiem', () => {
  it('calculates gross and deductible per diem correctly', () => {
    const result = calculatePerDiem(10, 69, 80);
    expect(result.grossPerDiem).toBe(690);
    expect(result.deductibleAmount).toBe(552);
  });

  it('treats negative days as zero', () => {
    const result = calculatePerDiem(-5, 69, 80);
    expect(result.daysOnRoad).toBe(0);
    expect(result.grossPerDiem).toBe(0);
  });

  it('handles a zero deductible percent', () => {
    const result = calculatePerDiem(10, 69, 0);
    expect(result.deductibleAmount).toBe(0);
  });
});

describe('countLoggedDaysOnRoad', () => {
  const makeRecord = (overrides: Partial<BookedLoadRecord>): BookedLoadRecord => ({
    id: 'L-1', brokerName: 'Broker A', rate: 1000, miles: 300, rpm: 3.33,
    bookedAt: '2026-01-01T00:00:00.000Z', paymentStatus: 'unpaid',
    ...overrides,
  });

  it('returns 0 with no gate events logged', () => {
    expect(countLoggedDaysOnRoad([makeRecord({})])).toBe(0);
  });

  it('counts unique calendar days across multiple gate events', () => {
    const record = makeRecord({
      gateTimes: {
        pickupCheckIn: '2026-01-01T08:00:00.000Z',
        pickupCheckOut: '2026-01-01T10:00:00.000Z',
        deliveryCheckIn: '2026-01-02T08:00:00.000Z',
        deliveryCheckOut: '2026-01-02T09:00:00.000Z',
      },
    });
    expect(countLoggedDaysOnRoad([record])).toBe(2);
  });

  it('deduplicates the same calendar day across multiple loads', () => {
    const recordA = makeRecord({ id: 'A', gateTimes: { pickupCheckIn: '2026-01-01T08:00:00.000Z' } });
    const recordB = makeRecord({ id: 'B', gateTimes: { pickupCheckIn: '2026-01-01T14:00:00.000Z' } });
    expect(countLoggedDaysOnRoad([recordA, recordB])).toBe(1);
  });
});
