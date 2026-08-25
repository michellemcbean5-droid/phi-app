import { describe, it, expect } from 'vitest';
import { sequenceStops, TripStop } from '../workers/TripSequencerWorker';

describe('sequenceStops', () => {
  const start = { latitude: 32.7767, longitude: -96.797 }; // Dallas

  it('returns an empty array when there are no stops', () => {
    expect(sequenceStops(start, [])).toEqual([]);
  });

  it('orders a single stop trivially', () => {
    const stops: TripStop[] = [{ id: 'A', label: 'Fort Worth', latitude: 32.7555, longitude: -97.3308 }];
    const result = sequenceStops(start, stops);
    expect(result.map((s) => s.id)).toEqual(['A']);
    expect(result[0].legDistanceMiles).toBeGreaterThan(0);
  });

  it('greedily visits the nearest stop first', () => {
    const near: TripStop = { id: 'NEAR', label: 'Fort Worth', latitude: 32.7555, longitude: -97.3308 };
    const far: TripStop = { id: 'FAR', label: 'Seattle', latitude: 47.6062, longitude: -122.3321 };
    const result = sequenceStops(start, [far, near]);
    expect(result.map((s) => s.id)).toEqual(['NEAR', 'FAR']);
  });

  it('never revisits a stop and includes every stop exactly once', () => {
    const stops: TripStop[] = [
      { id: 'A', label: 'A', latitude: 32.7555, longitude: -97.3308 },
      { id: 'B', label: 'B', latitude: 29.7604, longitude: -95.3698 },
      { id: 'C', label: 'C', latitude: 30.2672, longitude: -97.7431 },
    ];
    const result = sequenceStops(start, stops);
    expect(result).toHaveLength(3);
    expect(new Set(result.map((s) => s.id))).toEqual(new Set(['A', 'B', 'C']));
  });
});
