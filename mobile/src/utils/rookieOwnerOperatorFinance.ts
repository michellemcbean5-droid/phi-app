export interface DispatchMetricsInput {
  rate: number;
  loadedMiles: number;
  deadheadMiles: number;
  fuelCostPerMile: number;
  minimumAllInRpm: number;
  maximumDeadheadPercent: number;
}

export interface DispatchMetrics {
  totalMiles: number;
  loadedRpm: number;
  allInRpm: number;
  deadheadPercent: number;
  estimatedFuelCost: number;
  estimatedContribution: number;
  meetsMinimumAllInRpm: boolean;
  withinDeadheadLimit: boolean;
  reviewStatus: 'Strong fit' | 'Review carefully' | 'Below target';
}

export interface FactoringScenarioInput {
  invoiceAmount: number;
  factoringFeePercent: number;
  advancePercent: number;
  standardPaymentDays: number;
}

export interface FactoringScenario {
  invoiceAmount: number;
  factoringFee: number;
  immediateAdvance: number;
  reserveReleasedLater: number;
  netAfterFactoring: number;
  standardPaymentDays: number;
  effectiveFeePercent: number;
}

export interface CashFlowForecastInput {
  startingCash: number;
  expectedInvoices: Array<{ amount: number; expectedPaymentOn: string; status: 'pending' | 'paid' }>;
  fuelReserve: number;
  maintenanceReserve: number;
}

export interface CashFlowForecast {
  incomingAmount: number;
  pendingInvoiceAmount: number;
  reservedAmount: number;
  projectedCashAfterReserves: number;
  earliestExpectedPaymentOn?: string;
}

const roundMoney = (value: number): number => Number(value.toFixed(2));

const assertPositive = (name: string, value: number, allowZero = false): void => {
  const valid = Number.isFinite(value) && (allowZero ? value >= 0 : value > 0);
  if (!valid) throw new Error(`${name} must be ${allowZero ? 'zero or greater' : 'greater than zero'}.`);
};

export const calculateDispatchMetrics = (input: DispatchMetricsInput): DispatchMetrics => {
  assertPositive('Rate', input.rate);
  assertPositive('Loaded miles', input.loadedMiles);
  assertPositive('Deadhead miles', input.deadheadMiles, true);
  assertPositive('Fuel cost per mile', input.fuelCostPerMile, true);
  assertPositive('Minimum all-in RPM', input.minimumAllInRpm, true);
  assertPositive('Maximum deadhead percent', input.maximumDeadheadPercent, true);

  const totalMiles = input.loadedMiles + input.deadheadMiles;
  const loadedRpm = input.rate / input.loadedMiles;
  const allInRpm = input.rate / totalMiles;
  const deadheadPercent = (input.deadheadMiles / totalMiles) * 100;
  const estimatedFuelCost = totalMiles * input.fuelCostPerMile;
  const estimatedContribution = input.rate - estimatedFuelCost;
  const meetsMinimumAllInRpm = allInRpm >= input.minimumAllInRpm;
  const withinDeadheadLimit = deadheadPercent <= input.maximumDeadheadPercent;

  const reviewStatus = meetsMinimumAllInRpm && withinDeadheadLimit
    ? 'Strong fit'
    : !meetsMinimumAllInRpm
      ? 'Below target'
      : 'Review carefully';

  return {
    totalMiles,
    loadedRpm: roundMoney(loadedRpm),
    allInRpm: roundMoney(allInRpm),
    deadheadPercent: Number(deadheadPercent.toFixed(1)),
    estimatedFuelCost: roundMoney(estimatedFuelCost),
    estimatedContribution: roundMoney(estimatedContribution),
    meetsMinimumAllInRpm,
    withinDeadheadLimit,
    reviewStatus,
  };
};

export const calculateFactoringScenario = (input: FactoringScenarioInput): FactoringScenario => {
  assertPositive('Invoice amount', input.invoiceAmount);
  assertPositive('Factoring fee percent', input.factoringFeePercent, true);
  assertPositive('Advance percent', input.advancePercent, true);
  assertPositive('Standard payment days', input.standardPaymentDays, true);
  if (input.advancePercent > 100) throw new Error('Advance percent cannot exceed 100.');

  const factoringFee = input.invoiceAmount * (input.factoringFeePercent / 100);
  const immediateAdvance = input.invoiceAmount * (input.advancePercent / 100);
  const reserveReleasedLater = Math.max(0, input.invoiceAmount - immediateAdvance - factoringFee);
  const netAfterFactoring = input.invoiceAmount - factoringFee;

  return {
    invoiceAmount: roundMoney(input.invoiceAmount),
    factoringFee: roundMoney(factoringFee),
    immediateAdvance: roundMoney(immediateAdvance),
    reserveReleasedLater: roundMoney(reserveReleasedLater),
    netAfterFactoring: roundMoney(netAfterFactoring),
    standardPaymentDays: Math.round(input.standardPaymentDays),
    effectiveFeePercent: Number(input.factoringFeePercent.toFixed(2)),
  };
};

export const forecastCashFlow = (input: CashFlowForecastInput): CashFlowForecast => {
  assertPositive('Starting cash', input.startingCash, true);
  assertPositive('Fuel reserve', input.fuelReserve, true);
  assertPositive('Maintenance reserve', input.maintenanceReserve, true);

  const paidInvoices = input.expectedInvoices.filter((invoice) => invoice.status === 'paid');
  const pendingInvoices = input.expectedInvoices.filter((invoice) => invoice.status === 'pending');
  const incomingAmount = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingInvoiceAmount = pendingInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const reservedAmount = input.fuelReserve + input.maintenanceReserve;
  const expectedDates = pendingInvoices
    .map((invoice) => invoice.expectedPaymentOn)
    .filter((date) => !Number.isNaN(new Date(date).getTime()))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return {
    incomingAmount: roundMoney(incomingAmount),
    pendingInvoiceAmount: roundMoney(pendingInvoiceAmount),
    reservedAmount: roundMoney(reservedAmount),
    projectedCashAfterReserves: roundMoney(input.startingCash + incomingAmount - reservedAmount),
    earliestExpectedPaymentOn: expectedDates[0],
  };
};

export const addDaysToIsoDate = (date: Date, days: number): string => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
};
