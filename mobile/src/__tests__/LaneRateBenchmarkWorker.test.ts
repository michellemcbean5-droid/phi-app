import { describe, it, expect } from 'vitest';
import { benchmarkLoadRate } from '../workers/LaneRateBenchmarkWorker';
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
  miles: 250,
  rpm: 4.0,
  totalMiles: 250,
  weightLbs: 40000,
  ...overrides,
});

describe('benchmarkLoadRate', () => {
  it('returns at-market with no comparable loads on the board', () => {
    const load = makeLoad({ rpm: 3.5 });
    const result = benchmarkLoadRate(load, []);
    expect(result.classification).toBe('at-market');
    expect(result.sampleSize).toBe(0);
  });

  it('classifies a load well above the equipment-type average as above-market', () => {
    const board = [makeLoad({ id: 'A', rpm: 3.0 }), makeLoad({ id: 'B', rpm: 3.0 }), makeLoad({ id: 'C', rpm: 3.0 })];
    const highLoad = makeLoad({ id: 'HIGH', rpm: 4.0 });
    const result = benchmarkLoadRate(highLoad, board);
    expect(result.boardAverageRPM).toBe(3.0);
    expect(result.percentVsAverage).toBeCloseTo(33.3, 1);
    expect(result.classification).toBe('above-market');
  });

  it('classifies a load well below the equipment-type average as below-market', () => {
    const board = [makeLoad({ id: 'A', rpm: 4.0 }), makeLoad({ id: 'B', rpm: 4.0 })];
    const lowLoad = makeLoad({ id: 'LOW', rpm: 3.0 });
    const result = benchmarkLoadRate(lowLoad, board);
    expect(result.classification).toBe('below-market');
  });

  it('classifies a load within the band as at-market', () => {
    const board = [makeLoad({ id: 'A', rpm: 3.0 }), makeLoad({ id: 'B', rpm: 3.0 })];
    const closeLoad = makeLoad({ id: 'CLOSE', rpm: 3.1 });
    const result = benchmarkLoadRate(closeLoad, board);
    expect(result.classification).toBe('at-market');
  });

  it('only compares against loads of the same equipment type', () => {
    const board = [
      makeLoad({ id: 'REEFER', equipmentType: 'Reefer', rpm: 10.0 }),
      makeLoad({ id: 'VAN', equipmentType: 'Dry Van', rpm: 3.0 }),
    ];
    const load = makeLoad({ id: 'TARGET', equipmentType: 'Dry Van', rpm: 3.0 });
    const result = benchmarkLoadRate(load, board);
    expect(result.sampleSize).toBe(1);
    expect(result.boardAverageRPM).toBe(3.0);
  });
});
