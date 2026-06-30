// Compliance audit enhanced with Claude AI risk analysis.
// Claude identifies compliance risks and provides DOT-specific recommendations.

import { askClaudeJSON, isClaudeConfigured } from '../api/claudeClient';
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
  severity: 'Warning' | 'Violation' | 'Critical';
}

export interface DOTSafetyAuditReport {
  generatedAt: string;
  compliant: boolean;
  flaggedTransactions: FlaggedComplianceItem[];
  aiRiskSummary: string;
  recommendations: string[];
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    availableDriveHours: number;
    safetyScore: number;
  };
}

const COMPLIANCE_SYSTEM = `You are a DOT compliance expert specializing in trucking Hours of Service regulations (49 CFR Part 395).
Analyze driver data and provide actionable compliance recommendations. Output valid JSON only.`;

export const auditDailyTransactions = (
  transactions: DailyTransaction[],
  driverHOS: DriverAvailability,
): Omit<DOTSafetyAuditReport, 'aiRiskSummary' | 'recommendations'> & {
  aiRiskSummary: string;
  recommendations: string[];
} => {
  const flaggedTransactions: FlaggedComplianceItem[] = [];

  let cumulativeHours = 0;
  for (const tx of transactions) {
    cumulativeHours += tx.dutyHoursRequired;
    if (tx.dutyHoursRequired > driverHOS.availableDriveHours) {
      flaggedTransactions.push({
        transactionId: tx.transactionId,
        loadId: tx.loadId,
        reason: `Dispatch would exceed remaining HOS drive hours (${tx.dutyHoursRequired.toFixed(1)} hrs required, ${driverHOS.availableDriveHours.toFixed(1)} hrs available).`,
        severity: tx.dutyHoursRequired > driverHOS.availableDriveHours + 2 ? 'Critical' : 'Violation',
      });
    } else if (cumulativeHours > driverHOS.availableDriveHours * 0.85) {
      flaggedTransactions.push({
        transactionId: tx.transactionId,
        loadId: tx.loadId,
        reason: `Approaching HOS drive limit — ${(driverHOS.availableDriveHours - cumulativeHours).toFixed(1)} hrs remaining after this load.`,
        severity: 'Warning',
      });
    }
  }

  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.revenue, 0);
  const safetyScore = Math.max(0, 100 - flaggedTransactions.reduce((sum, f) => sum + (f.severity === 'Critical' ? 25 : f.severity === 'Violation' ? 18 : 8), 0));

  return {
    generatedAt: new Date().toISOString(),
    compliant: flaggedTransactions.filter((f) => f.severity !== 'Warning').length === 0,
    flaggedTransactions,
    aiRiskSummary: flaggedTransactions.length === 0
      ? 'All loads are within HOS compliance. No violations detected.'
      : `${flaggedTransactions.length} compliance issue(s) detected. Review flagged loads before dispatch.`,
    recommendations: flaggedTransactions.length === 0
      ? ['Maintain current dispatch schedule.', 'Take a 30-min rest break before the next load pickup.']
      : ['Do not dispatch flagged loads until driver HOS resets.', 'Log a 10-hour off-duty period before next drive window.'],
    summary: {
      totalTransactions: transactions.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      availableDriveHours: driverHOS.availableDriveHours,
      safetyScore,
    },
  };
};

export const runAIComplianceAudit = async (
  transactions: DailyTransaction[],
  driverHOS: DriverAvailability,
): Promise<DOTSafetyAuditReport> => {
  const baseReport = auditDailyTransactions(transactions, driverHOS);

  if (!isClaudeConfigured()) {
    return { ...baseReport, generatedAt: new Date().toISOString() };
  }

  try {
    const aiEnhancement = await askClaudeJSON<{
      aiRiskSummary: string;
      recommendations: string[];
      safetyScore: number;
    }>(
      `Analyze this trucking compliance data and provide DOT HOS risk assessment:
      Driver: ${driverHOS.driverId}
      Available drive hours: ${driverHOS.availableDriveHours}
      Available on-duty hours: ${driverHOS.availableOnDutyHours}
      Cycle hours remaining: ${driverHOS.cycleHoursRemaining}
      Transactions: ${JSON.stringify(transactions.map((t) => ({ id: t.transactionId, loadId: t.loadId, miles: t.miles, dutyHrsRequired: t.dutyHoursRequired })))}
      Flagged issues: ${baseReport.flaggedTransactions.length}

      Return JSON: { "aiRiskSummary": "2-3 sentence risk assessment", "recommendations": ["3-4 specific DOT compliance recommendations"], "safetyScore": 0-100 }`,
      COMPLIANCE_SYSTEM,
      512,
    );

    return {
      ...baseReport,
      aiRiskSummary: aiEnhancement.aiRiskSummary,
      recommendations: aiEnhancement.recommendations,
      summary: {
        ...baseReport.summary,
        safetyScore: aiEnhancement.safetyScore,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return { ...baseReport, generatedAt: new Date().toISOString() };
  }
};
