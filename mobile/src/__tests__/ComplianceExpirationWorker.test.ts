import { describe, it, expect } from 'vitest';
import { evaluateExpiration, getExpirationAlerts } from '../workers/ComplianceExpirationWorker';

const NOW = new Date('2026-01-01T00:00:00.000Z');

describe('evaluateExpiration', () => {
  it('returns null when no date is set', () => {
    expect(evaluateExpiration('Medical Card', null, NOW)).toBeNull();
  });

  it('returns null for an invalid date string', () => {
    expect(evaluateExpiration('Medical Card', 'not-a-date', NOW)).toBeNull();
  });

  it('classifies a date more than 30 days out as ok', () => {
    const result = evaluateExpiration('Medical Card', '2026-03-01T00:00:00.000Z', NOW);
    expect(result?.urgency).toBe('ok');
  });

  it('classifies a date within 30 days as expiring-soon', () => {
    const result = evaluateExpiration('Medical Card', '2026-01-15T00:00:00.000Z', NOW);
    expect(result?.urgency).toBe('expiring-soon');
    expect(result?.daysRemaining).toBe(14);
  });

  it('classifies a past date as expired', () => {
    const result = evaluateExpiration('Medical Card', '2025-12-01T00:00:00.000Z', NOW);
    expect(result?.urgency).toBe('expired');
    expect(result?.daysRemaining).toBeLessThan(0);
  });
});

describe('getExpirationAlerts', () => {
  it('filters out unset dates and sorts most urgent first', () => {
    const alerts = getExpirationAlerts(
      [
        { label: 'Inspection', dateISO: '2026-06-01T00:00:00.000Z' }, // ok
        { label: 'Medical Card', dateISO: '2025-12-01T00:00:00.000Z' }, // expired
        { label: 'CDL', dateISO: null }, // unset, filtered out
        { label: 'Registration', dateISO: '2026-01-10T00:00:00.000Z' }, // expiring soon
      ],
      NOW,
    );
    expect(alerts).toHaveLength(3);
    expect(alerts[0].label).toBe('Medical Card');
    expect(alerts[1].label).toBe('Registration');
    expect(alerts[2].label).toBe('Inspection');
  });
});
