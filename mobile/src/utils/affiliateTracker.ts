export interface ReferralTrackingRecord {
  referralId: string;
  transactionAmount: number;
  commissionRate: number;
  commissionAmount: number;
  trackedAt: string;
}

const COMMISSION_RATE = 0.02;

export const trackReferral = (referralId: string, transactionAmount: number): {
  commissionAmount: number;
  trackingRecord: ReferralTrackingRecord;
} => {
  if (!referralId.trim()) {
    throw new Error('Referral ID is required.');
  }

  if (!Number.isFinite(transactionAmount) || transactionAmount <= 0) {
    throw new Error('Transaction amount must be a positive number.');
  }

  const commissionAmount = Number((transactionAmount * COMMISSION_RATE).toFixed(2));

  return {
    commissionAmount,
    trackingRecord: {
      referralId,
      transactionAmount,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      trackedAt: new Date().toISOString(),
    },
  };
};
