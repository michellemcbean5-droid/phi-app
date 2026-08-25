import { describe, it, expect } from 'vitest';
import { filterUpcomingLoads } from '../workers/NextDayPlannerWorker';
import { Load } from '../workers/workers-15x';

const makeLoad = (id: string, pickupDate: string): Load => ({
  id,
  source: 'DAT',
  equipmentType: 'Dry Van',
  brokerName: 'Test Broker',
  brokerRating: 4.5,
  origin: { city: 'Dallas', state: 'TX', latitude: 32.7767, longitude: -96.797 },
  destination: { city: 'Houston', state: 'TX', latitude: 29.7604, longitude: -95.3698 },
  pickupDate,
  deliveryDate: '2026-01-05',
  rate: 1000,
  miles: 240,
  rpm: 4.17,
  totalMiles: 240,
  weightLbs: 40000,
});

describe('filterUpcomingLoads', () => {
  it('keeps loads picking up on or after the cutoff', () => {
    const loads = [makeLoad('AFTER', '2026-01-04'), makeLoad('SAME', '2026-01-03'), makeLoad('BEFORE', '2026-01-01')];
    const result = filterUpcomingLoads(loads, '2026-01-03');
    expect(result.map((l) => l.id).sort()).toEqual(['AFTER', 'SAME']);
  });

  it('returns all candidates when the cutoff date is invalid', () => {
    const loads = [makeLoad('A', '2026-01-04')];
    expect(filterUpcomingLoads(loads, 'not-a-date')).toEqual(loads);
  });

  it('returns an empty array when nothing qualifies', () => {
    const loads = [makeLoad('OLD', '2026-01-01')];
    expect(filterUpcomingLoads(loads, '2026-02-01')).toEqual([]);
  });
});
