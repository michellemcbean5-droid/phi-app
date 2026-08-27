import { describe, it, expect } from 'vitest';
import { totalAccessorialCharges, AccessorialCharge } from '../workers/AccessorialWorker';

describe('totalAccessorialCharges', () => {
  it('returns 0 for no charges', () => {
    expect(totalAccessorialCharges([])).toBe(0);
  });

  it('sums multiple charges', () => {
    const charges: AccessorialCharge[] = [
      { type: 'Extra Stop', amount: 75, loggedAt: '2026-01-01T00:00:00.000Z' },
      { type: 'Tarping', amount: 100, loggedAt: '2026-01-01T01:00:00.000Z' },
      { type: 'Lumper Fee', amount: 65, loggedAt: '2026-01-01T02:00:00.000Z' },
    ];
    expect(totalAccessorialCharges(charges)).toBe(240);
  });

  it('rounds to two decimal places', () => {
    const charges: AccessorialCharge[] = [
      { type: 'Driver Assist', amount: 33.333, loggedAt: '2026-01-01T00:00:00.000Z' },
      { type: 'Pallet Jack', amount: 25.001, loggedAt: '2026-01-01T00:00:00.000Z' },
    ];
    expect(totalAccessorialCharges(charges)).toBe(58.33);
  });
});
