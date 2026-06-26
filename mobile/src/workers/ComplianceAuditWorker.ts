import { DriverAvailability } from '../api/samsaraConnector';

export interface DailyTransaction {
  transactionId: string;
  loadId: string;
  miles: number;
  revenue: number;
  dutyHoursRequired: number;
}

export interface FlaggedComplianceItem {
  transactionId: string;
  loadId: string;
  reason: string;
}

export interface DOTSafetyAuditReport {
  generatedAt: string;
  compliant: boolean;
  flaggedTransactions: FlaggedComplianceItem[];
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    availableDriveHours: number;
    safetyScore: number;
  };
}

export const auditDailyTransactions = (
  transactions: DailyTransaction[],
  driverHOS: DriverAvailability,
): DOTSafetyAuditReport => {
  const flaggedTransactions = transactions
    .filter((transaction) => transaction.dutyHoursRequired > driverHOS.availableDriveHours)
    .map((transaction) => ({
      transactionId: transaction.transactionId,
      loadId: transaction.loadId,
      reason: 'Dispatch would exceed remaining HOS drive hours.',
    }));

  const totalRevenue = transactions.reduce((sum, transaction) => sum + transaction.revenue, 0);
  const safetyScore = Math.max(0, 100 - flaggedTransactions.length * 18);

  return {
    generatedAt: new Date().toISOString(),
    compliant: flaggedTransactions.length === 0,
    flaggedTransactions,
    summary: {
      totalTransactions: transactions.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      availableDriveHours: driverHOS.availableDriveHours,
      safetyScore,
    },
  };
};
