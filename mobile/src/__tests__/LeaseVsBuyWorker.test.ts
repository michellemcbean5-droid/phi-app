import { describe, it, expect } from 'vitest';
import { calculateMonthlyLoanPayment, compareLeaseVsBuy } from '../workers/LeaseVsBuyWorker';

describe('calculateMonthlyLoanPayment', () => {
  it('divides evenly with a 0% APR loan', () => {
    expect(calculateMonthlyLoanPayment(60000, 0, 60)).toBe(1000);
  });

  it('fully amortizes the principal to (near) zero over the term at a real APR', () => {
    const principal = 100000;
    const apr = 8.5;
    const term = 60;
    const payment = calculateMonthlyLoanPayment(principal, apr, term);
    const monthlyRate = apr / 100 / 12;

    let balance = principal;
    for (let i = 0; i < term; i += 1) {
      const interest = balance * monthlyRate;
      balance = balance + interest - payment;
    }
    expect(Math.abs(balance)).toBeLessThan(1);
  });

  it('throws for a non-positive term', () => {
    expect(() => calculateMonthlyLoanPayment(10000, 5, 0)).toThrow();
  });
});

describe('compareLeaseVsBuy', () => {
  const baseInput = {
    truckPrice: 120000,
    downPayment: 20000,
    loanAPRPercent: 6,
    termMonths: 60,
    estimatedResidualValue: 70000,
    leaseMonthlyPayment: 2200,
    monthlyMaintenanceBuy: 200,
    monthlyMaintenanceLease: 0,
  };

  it('recommends buying when the residual value makes ownership cheaper', () => {
    const result = compareLeaseVsBuy(baseInput);
    expect(result.recommendation).toBe('buy');
  });

  it('recommends leasing when residual value is low and maintenance is high', () => {
    const result = compareLeaseVsBuy({ ...baseInput, estimatedResidualValue: 0, monthlyMaintenanceBuy: 800 });
    expect(result.recommendation).toBe('lease');
  });

  it('a larger down payment reduces total buy cost, all else equal', () => {
    const lowDown = compareLeaseVsBuy({ ...baseInput, downPayment: 10000 });
    const highDown = compareLeaseVsBuy({ ...baseInput, downPayment: 40000 });
    // A bigger down payment lowers the loan principal (and thus interest paid),
    // but the down payment cash itself still counts toward total cost — the net
    // effect should be a lower or equal total cost from less interest paid overall.
    expect(highDown.totalBuyCost).toBeLessThan(lowDown.totalBuyCost);
  });

  it('costDifference is the absolute gap between the two total costs', () => {
    const result = compareLeaseVsBuy(baseInput);
    expect(result.costDifference).toBeCloseTo(Math.abs(result.totalBuyCost - result.totalLeaseCost), 2);
  });
});
