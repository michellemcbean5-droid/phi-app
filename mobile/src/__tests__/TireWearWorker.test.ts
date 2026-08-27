import { describe, it, expect } from 'vitest';
import { evaluateTireWear, TireReading } from '../workers/TireWearWorker';

describe('evaluateTireWear', () => {
  it('uses the 4/32" minimum for steer positions', () => {
    const readings: TireReading[] = [
      { position: 'Steer Left', treadDepth32nds: 10, mileageAtReading: 100000, dateISO: '2026-01-01T00:00:00.000Z' },
    ];
    const [result] = evaluateTireWear(readings);
    expect(result.minimumRequired32nds).toBe(4);
    expect(result.belowMinimum).toBe(false);
  });

  it('uses the 2/32" minimum for non-steer positions', () => {
    const readings: TireReading[] = [
      { position: 'Trailer', treadDepth32nds: 3, mileageAtReading: 100000, dateISO: '2026-01-01T00:00:00.000Z' },
    ];
    const [result] = evaluateTireWear(readings);
    expect(result.minimumRequired32nds).toBe(2);
    expect(result.belowMinimum).toBe(false);
  });

  it('flags a tire at or below the minimum as belowMinimum', () => {
    const readings: TireReading[] = [
      { position: 'Steer Right', treadDepth32nds: 4, mileageAtReading: 100000, dateISO: '2026-01-01T00:00:00.000Z' },
    ];
    const [result] = evaluateTireWear(readings);
    expect(result.belowMinimum).toBe(true);
  });

  it('returns null wear rate and projection with only one reading', () => {
    const readings: TireReading[] = [
      { position: 'Trailer', treadDepth32nds: 8, mileageAtReading: 100000, dateISO: '2026-01-01T00:00:00.000Z' },
    ];
    const [result] = evaluateTireWear(readings);
    expect(result.wearRatePer1000Miles).toBeNull();
    expect(result.milesUntilMinimum).toBeNull();
  });

  it('projects wear rate and miles until minimum from two readings', () => {
    const readings: TireReading[] = [
      { position: 'Steer Left', treadDepth32nds: 16, mileageAtReading: 100000, dateISO: '2026-01-01T00:00:00.000Z' },
      { position: 'Steer Left', treadDepth32nds: 10, mileageAtReading: 150000, dateISO: '2026-06-01T00:00:00.000Z' },
    ];
    const [result] = evaluateTireWear(readings);
    expect(result.latestTreadDepth32nds).toBe(10);
    expect(result.wearRatePer1000Miles).toBeCloseTo(0.12, 3);
    expect(result.milesUntilMinimum).toBe(50000);
  });

  it('sorts multiple positions with the soonest-to-need-replacement first', () => {
    const readings: TireReading[] = [
      { position: 'Steer Left', treadDepth32nds: 16, mileageAtReading: 0, dateISO: '2026-01-01T00:00:00.000Z' },
      { position: 'Steer Left', treadDepth32nds: 14, mileageAtReading: 10000, dateISO: '2026-02-01T00:00:00.000Z' }, // slow wear
      { position: 'Trailer', treadDepth32nds: 10, mileageAtReading: 0, dateISO: '2026-01-01T00:00:00.000Z' },
      { position: 'Trailer', treadDepth32nds: 4, mileageAtReading: 10000, dateISO: '2026-02-01T00:00:00.000Z' }, // fast wear
    ];
    const results = evaluateTireWear(readings);
    expect(results[0].position).toBe('Trailer');
    expect(results[1].position).toBe('Steer Left');
  });
});
