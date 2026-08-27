// Safety & Compliance sub-tasks: proactively alert on CDL medical card expirations
// (task 51) and track mandatory periodic vehicle inspections (task 52) before they
// lapse — a lapsed medical card or overdue inspection can put a driver out of service
// on a roadside check, so catching it weeks ahead matters.

export type ExpirationUrgency = 'ok' | 'expiring-soon' | 'expired';

export interface ExpirationStatus {
  label: string;
  dateISO: string;
  daysRemaining: number;
  urgency: ExpirationUrgency;
}

const EXPIRING_SOON_WINDOW_DAYS = 30;

export const evaluateExpiration = (label: string, dateISO: string | null, now: Date = new Date()): ExpirationStatus | null => {
  if (!dateISO) return null;

  const target = new Date(dateISO).getTime();
  if (Number.isNaN(target)) return null;

  const daysRemaining = Math.ceil((target - now.getTime()) / 86400000);
  const urgency: ExpirationUrgency = daysRemaining < 0 ? 'expired' : daysRemaining <= EXPIRING_SOON_WINDOW_DAYS ? 'expiring-soon' : 'ok';

  return { label, dateISO, daysRemaining, urgency };
};

export const getExpirationAlerts = (
  dates: { label: string; dateISO: string | null }[],
  now: Date = new Date(),
): ExpirationStatus[] => {
  const urgencyRank: Record<ExpirationUrgency, number> = { expired: 0, 'expiring-soon': 1, ok: 2 };
  return dates
    .map(({ label, dateISO }) => evaluateExpiration(label, dateISO, now))
    .filter((status): status is ExpirationStatus => status !== null)
    .sort((a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency] || a.daysRemaining - b.daysRemaining);
};
