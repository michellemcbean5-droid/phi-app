// Freight Procurement sub-task: maintain an internal scorebook of broker reliability
// and payment behavior, built entirely from the driver's own booking history — no
// external credit bureau, just "how has this specific broker actually treated me."

import { BookedLoadRecord } from '../store/loadsStore';

const ON_TIME_PAYMENT_DAYS = 30;

export interface BrokerScorecard {
  brokerName: string;
  loadsBooked: number;
  totalRevenue: number;
  avgRPM: number;
  paidLoads: number;
  unpaidLoads: number;
  avgDaysToPay: number | null;
  onTimePaymentRate: number | null;
  reliabilityScore: number;
}

const daysBetween = (aISO: string, bISO: string): number => (new Date(bISO).getTime() - new Date(aISO).getTime()) / 86400000;

export const buildBrokerScorebook = (bookingHistory: BookedLoadRecord[]): BrokerScorecard[] => {
  const byBroker = new Map<string, BookedLoadRecord[]>();
  bookingHistory.forEach((record) => {
    const existing = byBroker.get(record.brokerName) ?? [];
    byBroker.set(record.brokerName, [...existing, record]);
  });

  return [...byBroker.entries()]
    .map(([brokerName, records]) => {
      const loadsBooked = records.length;
      const totalRevenue = Number(records.reduce((sum, r) => sum + r.rate, 0).toFixed(2));
      const avgRPM = Number((records.reduce((sum, r) => sum + r.rpm, 0) / loadsBooked).toFixed(2));

      const paidRecords = records.filter((r) => r.paymentStatus === 'paid' && r.invoiceSentAt && r.paidAt);
      const paidLoads = records.filter((r) => r.paymentStatus === 'paid').length;
      const unpaidLoads = records.filter((r) => r.paymentStatus !== 'paid').length;

      const daysToPayList = paidRecords.map((r) => daysBetween(r.invoiceSentAt as string, r.paidAt as string));
      const avgDaysToPay = daysToPayList.length > 0
        ? Number((daysToPayList.reduce((sum, d) => sum + d, 0) / daysToPayList.length).toFixed(1))
        : null;
      const onTimePaymentRate = daysToPayList.length > 0
        ? Number(((daysToPayList.filter((d) => d <= ON_TIME_PAYMENT_DAYS).length / daysToPayList.length) * 100).toFixed(0))
        : null;

      // Composite score: paid-on-time behavior matters most; a broker with no payment
      // history yet gets a neutral starting score rather than being penalized outright.
      let reliabilityScore = 70;
      if (onTimePaymentRate !== null) reliabilityScore = Math.round(onTimePaymentRate * 0.7 + (paidLoads / loadsBooked) * 30);

      return { brokerName, loadsBooked, totalRevenue, avgRPM, paidLoads, unpaidLoads, avgDaysToPay, onTimePaymentRate, reliabilityScore };
    })
    .sort((a, b) => b.reliabilityScore - a.reliabilityScore || b.totalRevenue - a.totalRevenue);
};
