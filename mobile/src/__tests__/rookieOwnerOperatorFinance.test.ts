import { describe, expect, it } from 'vitest';
import {
  calculateDispatchMetrics,
  calculateFactoringScenario,
  forecastCashFlow,
} from '../utils/rookieOwnerOperatorFinance';

describe('rookie owner-operator finance tools', () => {
  it('calculates full-trip RPM, deadhead, fuel exposure, and a strong-fit result', () => {
    const result = calculateDispatchMetrics({
      rate: 2000,
      loadedMiles: 800,
      deadheadMiles: 100,
      fuelCostPerMile: 0.6,
      minimumAllInRpm: 2.1,
      maximumDeadheadPercent: 15,
    });

    expect(result.totalMiles).toBe(900);
    expect(result.loadedRpm).toBe(2.5);
    expect(result.allInRpm).toBe(2.22);
    expect(result.deadheadPercent).toBe(11.1);
    expect(result.estimatedFuelCost).toBe(540);
    expect(result.estimatedContribution).toBe(1460);
    expect(result.reviewStatus).toBe('Strong fit');
  });

  it('flags a plan below the driver’s all-in RPM target', () => {
    const result = calculateDispatchMetrics({
      rate: 1200,
      loadedMiles: 700,
      deadheadMiles: 100,
      fuelCostPerMile: 0.62,
      minimumAllInRpm: 2,
      maximumDeadheadPercent: 20,
    });

    expect(result.allInRpm).toBe(1.5);
    expect(result.meetsMinimumAllInRpm).toBe(false);
    expect(result.reviewStatus).toBe('Below target');
  });

  it('shows the factoring fee, immediate advance, reserve, and net proceeds', () => {
    const result = calculateFactoringScenario({
      invoiceAmount: 2000,
      factoringFeePercent: 3,
      advancePercent: 95,
      standardPaymentDays: 30,
    });

    expect(result.factoringFee).toBe(60);
    expect(result.immediateAdvance).toBe(1900);
    expect(result.reserveReleasedLater).toBe(40);
    expect(result.netAfterFactoring).toBe(1940);
    expect(result.effectiveFeePercent).toBe(3);
  });

  it('separates paid cash, pending receivables, and protected operating reserves', () => {
    const result = forecastCashFlow({
      startingCash: 1000,
      fuelReserve: 300,
      maintenanceReserve: 200,
      expectedInvoices: [
        { amount: 500, expectedPaymentOn: '2026-08-10T00:00:00.000Z', status: 'paid' },
        { amount: 1200, expectedPaymentOn: '2026-08-25T00:00:00.000Z', status: 'pending' },
        { amount: 400, expectedPaymentOn: '2026-08-22T00:00:00.000Z', status: 'pending' },
      ],
    });

    expect(result.incomingAmount).toBe(500);
    expect(result.pendingInvoiceAmount).toBe(1600);
    expect(result.reservedAmount).toBe(500);
    expect(result.projectedCashAfterReserves).toBe(1000);
    expect(result.earliestExpectedPaymentOn).toBe('2026-08-22T00:00:00.000Z');
  });

  it('rejects impossible factoring assumptions', () => {
    expect(() => calculateFactoringScenario({
      invoiceAmount: 1000,
      factoringFeePercent: 2,
      advancePercent: 120,
      standardPaymentDays: 30,
    })).toThrow('Advance percent cannot exceed 100.');
  });
});
