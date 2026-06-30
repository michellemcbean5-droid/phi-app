import { describe, expect, it } from 'vitest';
import { categorizeExpense, calculateRPMTrend } from '../utils/profitFormula';

describe('categorizeExpense', () => {
  it('classifies fuel stops correctly', () => {
    expect(categorizeExpense({ vendor: 'Pilot Flying J', description: 'Diesel fill-up', amount: 500 })).toBe('Fuel');
    expect(categorizeExpense({ vendor: 'Petro Stopping Centers', description: 'Fuel', amount: 450 })).toBe('Fuel');
  });

  it('classifies maintenance correctly', () => {
    expect(categorizeExpense({ vendor: 'Freightliner Service', description: 'Oil change and brake inspection', amount: 300 })).toBe('Maintenance');
    expect(categorizeExpense({ vendor: 'Tire Shop', description: 'Tires replacement', amount: 1200 })).toBe('Maintenance');
  });

  it('classifies unknown expenses as Miscellaneous', () => {
    expect(categorizeExpense({ vendor: 'Subway', description: 'Lunch', amount: 15 })).toBe('Miscellaneous');
  });

  it('throws on negative receipt amount', () => {
    expect(() => categorizeExpense({ vendor: 'Pilot', description: 'Fuel', amount: -1 })).toThrow();
  });
});

describe('calculateRPMTrend', () => {
  const loads = [
    { id: 'l-1', rpm: 3.8, pickupDate: '2025-06-18' },
    { id: 'l-2', rpm: 3.6, pickupDate: '2025-06-19' },
    { id: 'l-3', rpm: 3.5, pickupDate: '2025-06-20' },
    { id: 'l-4', rpm: 3.4, pickupDate: '2025-06-21' },
    { id: 'l-5', rpm: 3.3, pickupDate: '2025-06-22' },
    { id: 'l-6', rpm: 3.2, pickupDate: '2025-06-23' },
    { id: 'l-7', rpm: 3.1, pickupDate: '2025-06-24' },
    { id: 'l-8', rpm: 2.8, pickupDate: '2025-06-25' },
    { id: 'l-9', rpm: 2.6, pickupDate: '2025-06-26' },
  ];

  it('returns Stable when RPM is within 10% of previous period', () => {
    const result = calculateRPMTrend(loads.slice(0, 6), 3);
    expect(result.flag).toBe('Stable');
  });

  it('throws on invalid days value', () => {
    expect(() => calculateRPMTrend(loads, 0)).toThrow();
    expect(() => calculateRPMTrend(loads, -1)).toThrow();
    expect(() => calculateRPMTrend(loads, 1.5)).toThrow();
  });

  it('returns averageRpm rounded to 2 decimals', () => {
    const result = calculateRPMTrend(loads, 3);
    expect(result.averageRpm).toBe(Number(result.averageRpm.toFixed(2)));
  });
});
