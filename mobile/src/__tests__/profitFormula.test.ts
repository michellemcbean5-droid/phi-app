import { describe, expect, it } from 'vitest';
import { PHI_ProfitFormula, projectYearlyRevenue } from '../utils/profitFormula';

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
