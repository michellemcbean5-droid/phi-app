import { describe, expect, it } from 'vitest';
import { trackReferral } from '../utils/affiliateTracker';

describe('trackReferral', () => {
  it('calculates 2% commission correctly', () => {
    const result = trackReferral('ref-001', 5000);
    expect(result.commissionAmount).toBe(100);
    expect(result.trackingRecord.commissionRate).toBe(0.02);
    expect(result.trackingRecord.referralId).toBe('ref-001');
  });

  it('rounds commission to 2 decimal places', () => {
    const result = trackReferral('ref-002', 3333.33);
    expect(result.commissionAmount).toBe(66.67);
  });

  it('throws on empty referral ID', () => {
    expect(() => trackReferral('', 5000)).toThrow();
    expect(() => trackReferral('   ', 5000)).toThrow();
  });

  it('throws on non-positive transaction amount', () => {
    expect(() => trackReferral('ref-003', 0)).toThrow();
    expect(() => trackReferral('ref-003', -100)).toThrow();
    expect(() => trackReferral('ref-003', Number.NaN)).toThrow();
  });
});
