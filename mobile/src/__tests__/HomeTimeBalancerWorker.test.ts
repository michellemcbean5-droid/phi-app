import { describe, it, expect } from 'vitest';
import { evaluateHomeTimeFit } from '../workers/HomeTimeBalancerWorker';
import { Load } from '../workers/workers-15x';

const makeLoad = (deliveryDate: string, rpm: number): Load => ({
  id: 'L-1',
  source: 'DAT',
  equipmentType: 'Dry Van',
  brokerName: 'Test Broker',
  brokerRating: 4.5,
  origin: { city: 'Dallas', state: 'TX', latitude: 32.7767, longitude: -96.797 },
  destination: { city: 'Houston', state: 'TX', latitude: 29.7604, longitude: -95.3698 },
  pickupDate: '2026-01-01',
  deliveryDate,
  rate: 1000,
  miles: 240,
  rpm,
  totalMiles: 240,
  weightLbs: 40000,
});

describe('evaluateHomeTimeFit', () => {
  it('always recommends taking a load when no home-time target is set', () => {
    const result = evaluateHomeTimeFit(makeLoad('2026-01-10', 2.0), null, 2.5, 20);
    expect(result.recommendation).toBe('take');
    expect(result.meetsHomeTime).toBe(true);
  });

  it('recommends taking a load that delivers on or before the target date', () => {
    const result = evaluateHomeTimeFit(makeLoad('2026-01-03', 2.5), '2026-01-05', 2.5, 20);
    expect(result.meetsHomeTime).toBe(true);
    expect(result.recommendation).toBe('take');
  });

  it('skips a load that delays home time without a sufficient pay premium', () => {
    const result = evaluateHomeTimeFit(makeLoad('2026-01-08', 2.6), '2026-01-05', 2.5, 20);
    expect(result.meetsHomeTime).toBe(false);
    expect(result.daysPastHomeTarget).toBe(3);
    expect(result.recommendation).toBe('skip-delays-home-time');
  });

  it('recommends take-if-premium when the pay premium clears the threshold', () => {
    const result = evaluateHomeTimeFit(makeLoad('2026-01-08', 3.5), '2026-01-05', 2.5, 20);
    expect(result.meetsHomeTime).toBe(false);
    expect(result.rpmPremiumPercent).toBe(40);
    expect(result.recommendation).toBe('take-if-premium');
  });
});
