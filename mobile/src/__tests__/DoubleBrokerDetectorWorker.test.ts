import { describe, it, expect } from 'vitest';
import { detectDoubleBrokeredLoads } from '../workers/DoubleBrokerDetectorWorker';
import { Load } from '../workers/workers-15x';

const makeLoad = (overrides: Partial<Load>): Load => ({
  id: 'L-1',
  source: 'DAT',
  equipmentType: 'Dry Van',
  brokerName: 'Broker A',
  brokerRating: 4.5,
  origin: { city: 'Dallas', state: 'TX', latitude: 32.7767, longitude: -96.797 },
  destination: { city: 'Houston', state: 'TX', latitude: 29.7604, longitude: -95.3698 },
  pickupDate: '2026-01-01',
  deliveryDate: '2026-01-02',
  rate: 1000,
  miles: 240,
  rpm: 4.0,
  totalMiles: 240,
  weightLbs: 40000,
  ...overrides,
});

describe('detectDoubleBrokeredLoads', () => {
  it('does not flag distinct loads on different lanes', () => {
    const loads = [
      makeLoad({ id: 'A', brokerName: 'Broker A' }),
      makeLoad({ id: 'B', brokerName: 'Broker B', destination: { city: 'Austin', state: 'TX', latitude: 30.27, longitude: -97.74 } }),
    ];
    expect(detectDoubleBrokeredLoads(loads)).toHaveLength(0);
  });

  it('does not flag the same lane posted by the same broker twice', () => {
    const loads = [
      makeLoad({ id: 'A', brokerName: 'Broker A' }),
      makeLoad({ id: 'B', brokerName: 'Broker A' }),
    ];
    expect(detectDoubleBrokeredLoads(loads)).toHaveLength(0);
  });

  it('flags an identical lane and pickup date posted under different broker names', () => {
    const loads = [
      makeLoad({ id: 'A', brokerName: 'Broker A' }),
      makeLoad({ id: 'B', brokerName: 'Broker B' }),
    ];
    const flags = detectDoubleBrokeredLoads(loads);
    expect(flags).toHaveLength(2);
    expect(flags.every((f) => f.severity === 'high')).toBe(true);
    expect(flags.map((f) => f.loadId).sort()).toEqual(['A', 'B']);
  });

  it('flags a bait-rate load: low broker rating paying well above the board average', () => {
    const normal1 = makeLoad({ id: 'N1', brokerName: 'Normal 1', rpm: 3.0, brokerRating: 4.5, destination: { city: 'A', state: 'TX', latitude: 1, longitude: 1 } });
    const normal2 = makeLoad({ id: 'N2', brokerName: 'Normal 2', rpm: 3.0, brokerRating: 4.5, destination: { city: 'B', state: 'TX', latitude: 2, longitude: 2 } });
    const bait = makeLoad({ id: 'BAIT', brokerName: 'Sketchy Co', rpm: 6.0, brokerRating: 2.0, destination: { city: 'C', state: 'TX', latitude: 3, longitude: 3 } });
    const flags = detectDoubleBrokeredLoads([normal1, normal2, bait]);
    expect(flags).toHaveLength(1);
    expect(flags[0].loadId).toBe('BAIT');
    expect(flags[0].severity).toBe('medium');
  });

  it('does not flag a low-rated broker paying a normal rate', () => {
    const normal = makeLoad({ id: 'N', brokerRating: 4.5, rpm: 3.0, destination: { city: 'A', state: 'TX', latitude: 1, longitude: 1 } });
    const lowRated = makeLoad({ id: 'LOW', brokerRating: 2.5, rpm: 3.1, destination: { city: 'B', state: 'TX', latitude: 2, longitude: 2 } });
    expect(detectDoubleBrokeredLoads([normal, lowRated])).toHaveLength(0);
  });

  it('handles an empty load list', () => {
    expect(detectDoubleBrokeredLoads([])).toHaveLength(0);
  });
});
