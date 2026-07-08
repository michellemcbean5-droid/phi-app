import { describe, expect, it } from 'vitest';
import { runHOSPreFilter } from '../workers/HOSPreFilter';

describe('runHOSPreFilter', () => {
  it('clears a driver with meaningful drive time left', () => {
    const result = runHOSPreFilter({ driveRemainingHours: 8 });
    expect(result.compliant).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('rejects a driver already essentially out of hours', () => {
    const result = runHOSPreFilter({ driveRemainingHours: 0.5 });
    expect(result.compliant).toBe(false);
    expect(result.reason).toMatch(/drive time left/);
  });

  it('does not reject a long multi-day haul just for exceeding one day of hours', () => {
    // A long OTR haul spans multiple days with required rest resets — that's normal
    // freight, not an HOS violation, so the pre-filter only cares about right now.
    const result = runHOSPreFilter({ driveRemainingHours: 10 });
    expect(result.compliant).toBe(true);
  });

  it('respects a custom minimum threshold', () => {
    const result = runHOSPreFilter({ driveRemainingHours: 1.5, minimumDriveHoursRequired: 2 });
    expect(result.compliant).toBe(false);
  });

  it('rejects negative inputs', () => {
    expect(() => runHOSPreFilter({ driveRemainingHours: -1 })).toThrow();
  });
});
