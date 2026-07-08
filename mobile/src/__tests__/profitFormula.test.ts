import { describe, expect, it } from 'vitest';
import { calculateLiveCPM, calculateMinimumRPM, PHI_ProfitFormula, projectYearlyRevenue } from '../utils/profitFormula';

describe('PHI_ProfitFormula', () => {
  it('calculates net profit correctly', () => {
    expect(
      PHI_ProfitFormula({
        revenue: 5000,
        fuel: 1200,
        maintenance: 300,
        insurance: 250,
        expenses: 150,
      }),
    ).toEqual({
      netProfit: 3100,
      operatingCost: 1900,
      profitMargin: 62,
    });
  });

  it('rejects negative inputs', () => {
    expect(() =>
      PHI_ProfitFormula({
        revenue: 5000,
        fuel: -1,
        maintenance: 300,
        insurance: 250,
        expenses: 150,
      }),
    ).toThrow();
  });
});

describe('projectYearlyRevenue', () => {
  it('projects yearly revenue from stable daily earnings', () => {
    const projection = projectYearlyRevenue([3200, 3200, 3200, 3200, 3200, 3200, 3200]);
    expect(projection.projectedRevenue).toBe(1168000);
    expect(projection.onTrack).toBe(false);
    expect(projection.gapToTarget).toBe(2000);
  });
});

describe('calculateLiveCPM', () => {
  it('divides total expenses by total miles driven', () => {
    expect(calculateLiveCPM(1250, 1000)).toBe(1.25);
  });

  it('returns 0 when no miles have been driven yet', () => {
    expect(calculateLiveCPM(500, 0)).toBe(0);
  });

  it('rejects negative inputs', () => {
    expect(() => calculateLiveCPM(-1, 1000)).toThrow();
  });
});

describe('calculateMinimumRPM', () => {
  it('applies a percentage margin on top of live CPM', () => {
    expect(calculateMinimumRPM(1.5, 60)).toBe(2.4);
  });

  it('rejects a negative margin', () => {
    expect(() => calculateMinimumRPM(1.5, -10)).toThrow();
  });
});
