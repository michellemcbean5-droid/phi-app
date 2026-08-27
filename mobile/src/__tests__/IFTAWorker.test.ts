import { describe, it, expect } from 'vitest';
import { calculateIFTAQuarterly } from '../workers/IFTAWorker';

describe('calculateIFTAQuarterly', () => {
  it('nets to zero when purchased gallons exactly match miles-implied consumption', () => {
    const result = calculateIFTAQuarterly([
      { state: 'TX', milesDriven: 500, gallonsPurchased: 100, taxRatePerGallon: 0.20 },
    ]);
    expect(result.fleetMPG).toBe(5);
    expect(result.jurisdictions[0].taxableGallons).toBe(100);
    expect(result.jurisdictions[0].taxDue).toBe(0);
    expect(result.netTaxDue).toBe(0);
  });

  it('credits a jurisdiction where more fuel was bought than miles driven there implies, and charges one where less was', () => {
    const result = calculateIFTAQuarterly([
      { state: 'TX', milesDriven: 100, gallonsPurchased: 100, taxRatePerGallon: 0.18 },
      { state: 'CA', milesDriven: 400, gallonsPurchased: 0, taxRatePerGallon: 0.40 },
    ]);
    expect(result.fleetMPG).toBe(5);
    const tx = result.jurisdictions.find((j) => j.state === 'TX')!;
    const ca = result.jurisdictions.find((j) => j.state === 'CA')!;
    expect(tx.taxableGallons).toBe(20);
    expect(tx.taxDue).toBeCloseTo(-14.4, 2); // credit
    expect(ca.taxableGallons).toBe(80);
    expect(ca.taxDue).toBeCloseTo(32.0, 2); // owed
    expect(result.netTaxDue).toBeCloseTo(17.6, 2);
  });

  it('does not divide by zero when no fuel has been purchased anywhere yet', () => {
    const result = calculateIFTAQuarterly([
      { state: 'TX', milesDriven: 100, gallonsPurchased: 0, taxRatePerGallon: 0.20 },
    ]);
    expect(result.fleetMPG).toBe(0);
    expect(result.jurisdictions[0].taxableGallons).toBe(0);
    expect(Number.isFinite(result.jurisdictions[0].taxDue)).toBe(true);
    expect(result.netTaxDue).toBe(0);
  });

  it('returns an empty result for no jurisdictions', () => {
    const result = calculateIFTAQuarterly([]);
    expect(result.totalMiles).toBe(0);
    expect(result.netTaxDue).toBe(0);
    expect(result.jurisdictions).toHaveLength(0);
  });
});
