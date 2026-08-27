import { describe, it, expect } from 'vitest';
import { estimateDEFStatus } from '../workers/DEFTrackerWorker';

describe('estimateDEFStatus', () => {
  it('reports a full tank with zero miles since fill', () => {
    const result = estimateDEFStatus(15, 0, 6.5);
    expect(result.estimatedGallonsRemaining).toBe(15);
    expect(result.estimatedPercentRemaining).toBe(100);
    expect(result.refillSoon).toBe(false);
  });

  it('estimates gallons remaining and miles until empty using the 2.5% consumption ratio', () => {
    const result = estimateDEFStatus(15, 3000, 6.5);
    expect(result.estimatedGallonsRemaining).toBeCloseTo(3.46, 1);
    expect(result.estimatedPercentRemaining).toBeCloseTo(23.1, 0);
    expect(result.estimatedMilesUntilEmpty).toBe(900);
  });

  it('flags refillSoon once remaining percent drops to the threshold', () => {
    const result = estimateDEFStatus(15, 3200, 6.5);
    expect(result.estimatedPercentRemaining).toBeLessThanOrEqual(20);
    expect(result.refillSoon).toBe(true);
  });

  it('does not flag refillSoon well above the threshold', () => {
    const result = estimateDEFStatus(15, 500, 6.5);
    expect(result.refillSoon).toBe(false);
  });

  it('never reports negative gallons remaining or negative miles once the tank is depleted', () => {
    const result = estimateDEFStatus(15, 10000, 6.5);
    expect(result.estimatedGallonsRemaining).toBe(0);
    expect(result.estimatedMilesUntilEmpty).toBe(0);
  });

  it('throws for non-positive tank capacity or MPG', () => {
    expect(() => estimateDEFStatus(0, 100, 6.5)).toThrow();
    expect(() => estimateDEFStatus(15, 100, 0)).toThrow();
  });
});
