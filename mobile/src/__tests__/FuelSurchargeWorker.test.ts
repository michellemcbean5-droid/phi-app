import { describe, it, expect } from 'vitest';
import { verifyFuelSurcharge } from '../workers/FuelSurchargeWorker';

describe('verifyFuelSurcharge', () => {
  it('calculates the fair FSC using the standard (price - baseline) / MPG formula', () => {
    const result = verifyFuelSurcharge({
      currentDieselPricePerGallon: 3.82,
      baselineDieselPricePerGallon: 1.20,
      truckMPG: 6.5,
      tripMiles: 500,
      quotedFSC: 500,
    });
    // (3.82 - 1.20) / 6.5 = 0.4031 per mile * 500 miles = 201.54
    expect(result.fairFSCPerMile).toBeCloseTo(0.403, 2);
    expect(result.fairFSCTotal).toBeCloseTo(201.54, 1);
  });

  it('flags a quoted FSC well below the fair calculation as unfair', () => {
    const result = verifyFuelSurcharge({
      currentDieselPricePerGallon: 3.82,
      baselineDieselPricePerGallon: 1.20,
      truckMPG: 6.5,
      tripMiles: 500,
      quotedFSC: 50,
    });
    expect(result.isFair).toBe(false);
    expect(result.shortfall).toBeGreaterThan(0);
  });

  it('accepts a quoted FSC that matches or exceeds the fair calculation', () => {
    const result = verifyFuelSurcharge({
      currentDieselPricePerGallon: 3.82,
      baselineDieselPricePerGallon: 1.20,
      truckMPG: 6.5,
      tripMiles: 500,
      quotedFSC: 250,
    });
    expect(result.isFair).toBe(true);
  });

  it('accepts a quote within the small fairness tolerance', () => {
    const result = verifyFuelSurcharge({
      currentDieselPricePerGallon: 3.82,
      baselineDieselPricePerGallon: 1.20,
      truckMPG: 6.5,
      tripMiles: 500,
      quotedFSC: 195, // slightly under 201.54 but within 5% tolerance
    });
    expect(result.isFair).toBe(true);
  });

  it('treats diesel price below baseline as zero surcharge, not negative', () => {
    const result = verifyFuelSurcharge({
      currentDieselPricePerGallon: 1.00,
      baselineDieselPricePerGallon: 1.20,
      truckMPG: 6.5,
      tripMiles: 500,
      quotedFSC: 0,
    });
    expect(result.fairFSCTotal).toBe(0);
    expect(result.isFair).toBe(true);
  });

  it('throws when truck MPG is zero or negative', () => {
    expect(() =>
      verifyFuelSurcharge({ currentDieselPricePerGallon: 3.82, baselineDieselPricePerGallon: 1.2, truckMPG: 0, tripMiles: 500, quotedFSC: 0 }),
    ).toThrow();
  });
});
