// Fleet Procurement sub-task: model a real lease-versus-purchase financial projection
// for a newly licensed operator deciding how to get their first truck. Uses the
// standard loan amortization formula, not a rough estimate, and compares both paths
// over the same time horizon so it's an apples-to-apples decision.

export interface LeaseVsBuyInput {
  truckPrice: number;
  downPayment: number;
  loanAPRPercent: number;
  termMonths: number;
  estimatedResidualValue: number;
  leaseMonthlyPayment: number;
  monthlyMaintenanceBuy: number;
  monthlyMaintenanceLease: number;
}

export interface LeaseVsBuyResult {
  monthlyLoanPayment: number;
  totalBuyCost: number;
  totalLeaseCost: number;
  costDifference: number;
  recommendation: 'buy' | 'lease';
}

export const calculateMonthlyLoanPayment = (principal: number, annualRatePercent: number, termMonths: number): number => {
  if (termMonths <= 0) throw new Error('Loan term must be greater than zero.');
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return Number((principal / termMonths).toFixed(2));
  const payment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
  return Number(payment.toFixed(2));
};

export const compareLeaseVsBuy = (input: LeaseVsBuyInput): LeaseVsBuyResult => {
  const principal = Math.max(0, input.truckPrice - input.downPayment);
  const monthlyLoanPayment = calculateMonthlyLoanPayment(principal, input.loanAPRPercent, input.termMonths);

  const totalBuyCost = Number((
    input.downPayment
    + monthlyLoanPayment * input.termMonths
    + input.monthlyMaintenanceBuy * input.termMonths
    - input.estimatedResidualValue
  ).toFixed(2));

  const totalLeaseCost = Number((
    (input.leaseMonthlyPayment + input.monthlyMaintenanceLease) * input.termMonths
  ).toFixed(2));

  const costDifference = Number(Math.abs(totalBuyCost - totalLeaseCost).toFixed(2));
  const recommendation: 'buy' | 'lease' = totalBuyCost <= totalLeaseCost ? 'buy' : 'lease';

  return { monthlyLoanPayment, totalBuyCost, totalLeaseCost, costDifference, recommendation };
};
