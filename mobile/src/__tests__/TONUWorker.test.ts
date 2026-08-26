import { describe, it, expect } from 'vitest';
import { evaluateTONUEligibility } from '../workers/TONUWorker';

describe('evaluateTONUEligibility', () => {
  it('is not eligible when the load was never cancelled', () => {
    const result = evaluateTONUEligibility({ bookingState: 'booked', pickupCheckInISO: '2026-01-01T08:00:00.000Z', standardTONURate: 250 });
    expect(result.eligible).toBe(false);
    expect(result.claimAmount).toBe(0);
  });

  it('is not eligible when cancelled before the driver checked in at pickup', () => {
    const result = evaluateTONUEligibility({ bookingState: 'cancelled', pickupCheckInISO: null, standardTONURate: 250 });
    expect(result.eligible).toBe(false);
    expect(result.claimAmount).toBe(0);
    expect(result.reason).toMatch(/had not checked in/);
  });

  it('is eligible when cancelled after the driver checked in at pickup', () => {
    const result = evaluateTONUEligibility({ bookingState: 'cancelled', pickupCheckInISO: '2026-01-01T08:00:00.000Z', standardTONURate: 250 });
    expect(result.eligible).toBe(true);
    expect(result.claimAmount).toBe(250);
    expect(result.reason).toMatch(/eligible for a \$250 TONU/);
  });

  it('uses the driver-configured TONU rate, not a hardcoded value', () => {
    const result = evaluateTONUEligibility({ bookingState: 'cancelled', pickupCheckInISO: '2026-01-01T08:00:00.000Z', standardTONURate: 350 });
    expect(result.claimAmount).toBe(350);
  });
});
