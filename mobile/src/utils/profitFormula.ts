export interface ProfitFormulaInput {
  revenue: number;
  fuel: number;
  maintenance: number;
  insurance: number;
  expenses: number;
}

export interface LoadTrendInput {
  id: string;
  rpm: number;
  pickupDate: string;
}

export interface ReceiptData {
  vendor: string;
  description: string;
  amount: number;
}

const TARGET_YEARLY_REVENUE = 1_170_000;

const assertNonNegativeDecimal = (value: number, fieldName: string): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} must be a positive decimal.`);
  }
};

export const PHI_ProfitFormula = ({
  revenue,
  fuel,
  maintenance,
  insurance,
  expenses,
}: ProfitFormulaInput): {
  netProfit: number;
  operatingCost: number;
  profitMargin: number;
} => {
  assertNonNegativeDecimal(revenue, 'Revenue');
  assertNonNegativeDecimal(fuel, 'Fuel');
  assertNonNegativeDecimal(maintenance, 'Maintenance');
  assertNonNegativeDecimal(insurance, 'Insurance');
  assertNonNegativeDecimal(expenses, 'Expenses');

  const operatingCost = Number((fuel + maintenance + insurance + expenses).toFixed(2));
  const netProfit = Number((revenue - operatingCost).toFixed(2));
  const profitMargin = revenue === 0 ? 0 : Number(((netProfit / revenue) * 100).toFixed(2));

  return { netProfit, operatingCost, profitMargin };
};

export const calculateRPMTrend = (loads: LoadTrendInput[], days: number): {
  averageRpm: number;
  previousAverageRpm: number;
  trendPercentage: number;
  flag: 'Stable' | 'Market Risk';
} => {
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error('Days must be a positive integer.');
  }

  const sortedLoads = [...loads].sort(
    (left, right) => new Date(left.pickupDate).getTime() - new Date(right.pickupDate).getTime(),
  );
  const currentWindow = sortedLoads.slice(-days);
  const previousWindow = sortedLoads.slice(-(days * 2), -days);

  const average = (items: LoadTrendInput[]): number => {
    if (items.length === 0) {
      return 0;
    }

    return Number((items.reduce((sum, load) => sum + load.rpm, 0) / items.length).toFixed(2));
  };

  const averageRpm = average(currentWindow);
  const previousAverageRpm = average(previousWindow);
  const trendPercentage = previousAverageRpm === 0
    ? 0
    : Number((((averageRpm - previousAverageRpm) / previousAverageRpm) * 100).toFixed(2));

  return {
    averageRpm,
    previousAverageRpm,
    trendPercentage,
    flag: previousAverageRpm > 0 && averageRpm <= previousAverageRpm * 0.9 ? 'Market Risk' : 'Stable',
  };
};

export const projectYearlyRevenue = (dailyEarnings: number[]): {
  projectedRevenue: number;
  targetRevenue: number;
  onTrack: boolean;
  gapToTarget: number;
} => {
  if (dailyEarnings.length === 0) {
    throw new Error('Daily earnings are required to project yearly revenue.');
  }

  dailyEarnings.forEach((earning, index) => assertNonNegativeDecimal(earning, `Daily earnings ${index + 1}`));

  const sampleSize = dailyEarnings.length;
  const xMean = (sampleSize - 1) / 2;
  const yMean = dailyEarnings.reduce((sum, value) => sum + value, 0) / sampleSize;

  let numerator = 0;
  let denominator = 0;
  dailyEarnings.forEach((value, index) => {
    numerator += (index - xMean) * (value - yMean);
    denominator += (index - xMean) ** 2;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  const projectedRevenue = Number(
    Array.from({ length: 365 }, (_, index) => intercept + slope * index)
      .reduce((sum, projectedDaily) => sum + Math.max(projectedDaily, 0), 0)
      .toFixed(2),
  );

  return {
    projectedRevenue,
    targetRevenue: TARGET_YEARLY_REVENUE,
    onTrack: projectedRevenue >= TARGET_YEARLY_REVENUE,
    gapToTarget: Number((TARGET_YEARLY_REVENUE - projectedRevenue).toFixed(2)),
  };
};

export const categorizeExpense = (receiptData: ReceiptData): 'Fuel' | 'Maintenance' | 'Miscellaneous' => {
  assertNonNegativeDecimal(receiptData.amount, 'Receipt amount');
  const descriptor = `${receiptData.vendor} ${receiptData.description}`.toLowerCase();

  if (/(fuel|diesel|petro|pilot|flying j)/.test(descriptor)) {
    return 'Fuel';
  }

  if (/(repair|service|tires|maintenance|oil|brake)/.test(descriptor)) {
    return 'Maintenance';
  }

  return 'Miscellaneous';
};
