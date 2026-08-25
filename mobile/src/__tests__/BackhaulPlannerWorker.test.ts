import { describe, it, expect } from 'vitest';
import { findBackhauls, haversineDistanceMiles } from '../workers/BackhaulPlannerWorker';
import { Load } from '../workers/workers-15x';

const makeLoad = (overrides: Partial<Load>): Load => ({
  id: 'L-1',
  source: 'DAT',
  equipmentType: 'Dry Van',
  brokerName: 'Test Broker',
  brokerRating: 4.5,
  origin: { city: 'Dallas', state: 'TX', latitude: 32.7767, longitude: -96.797 },
  destination: { city: 'Houston', state: 'TX', latitude: 29.7604, longitude: -95.3698 },
  pickupDate: '2026-01-01',
  deliveryDate: '2026-01-02',
  rate: 1000,
  miles: 240,
  rpm: 4.17,
  totalMiles: 240,
  weightLbs: 40000,
  ...overrides,
});

describe('haversineDistanceMiles', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistanceMiles({ latitude: 32.7767, longitude: -96.797 }, { latitude: 32.7767, longitude: -96.797 })).toBe(0);
  });

  it('returns a plausible distance for Dallas to Houston', () => {
    const distance = haversineDistanceMiles(
      { latitude: 32.7767, longitude: -96.797 },
      { latitude: 29.7604, longitude: -95.3698 },
    );
    expect(distance).toBeGreaterThan(200);
    expect(distance).toBeLessThan(260);
  });
});

describe('findBackhauls', () => {
  const dropLocation = { latitude: 29.7604, longitude: -95.3698 }; // Houston

  it('excludes the current load itself', () => {
    const current = makeLoad({ id: 'CURRENT' });
    const results = findBackhauls(dropLocation, [current], 'CURRENT');
    expect(results).toHaveLength(0);
  });

  it('excludes loads whose origin is too far from the drop point', () => {
    const farLoad = makeLoad({ id: 'FAR', origin: { city: 'Seattle', state: 'WA', latitude: 47.6062, longitude: -122.3321 } });
    const results = findBackhauls(dropLocation, [farLoad], 'CURRENT', { maxOriginDistanceMiles: 75 });
    expect(results).toHaveLength(0);
  });

  it('includes and ranks nearby loads by score', () => {
    const nearHighRPM = makeLoad({ id: 'NEAR-HIGH', origin: { city: 'Houston', state: 'TX', latitude: 29.75, longitude: -95.36 }, rpm: 4.0 });
    const nearLowRPM = makeLoad({ id: 'NEAR-LOW', origin: { city: 'Houston', state: 'TX', latitude: 29.75, longitude: -95.36 }, rpm: 2.0 });
    const results = findBackhauls(dropLocation, [nearLowRPM, nearHighRPM], 'CURRENT');
    expect(results.map((r) => r.load.id)).toEqual(['NEAR-HIGH', 'NEAR-LOW']);
  });

  it('penalizes distance so a far high-RPM load can rank below a close lower-RPM load', () => {
    const close = makeLoad({ id: 'CLOSE', origin: { city: 'Houston', state: 'TX', latitude: 29.76, longitude: -95.37 }, rpm: 3.0 });
    const farButHigher = makeLoad({ id: 'FARISH', origin: { city: 'Austin', state: 'TX', latitude: 30.2672, longitude: -97.7431 }, rpm: 3.2 });
    const results = findBackhauls(dropLocation, [close, farButHigher], 'CURRENT', { maxOriginDistanceMiles: 200 });
    expect(results[0].load.id).toBe('CLOSE');
  });

  it('respects the minRPM filter', () => {
    const lowPaying = makeLoad({ id: 'LOW', origin: { city: 'Houston', state: 'TX', latitude: 29.75, longitude: -95.36 }, rpm: 1.0 });
    const results = findBackhauls(dropLocation, [lowPaying], 'CURRENT', { minRPM: 2.0 });
    expect(results).toHaveLength(0);
  });
});
