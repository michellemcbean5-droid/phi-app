import { describe, it, expect } from 'vitest';
import { buildBrokerScorebook } from '../workers/BrokerScorebookWorker';
import { BookedLoadRecord } from '../store/loadsStore';

const makeRecord = (overrides: Partial<BookedLoadRecord>): BookedLoadRecord => ({
  id: 'L-1',
  brokerName: 'Uber Freight Direct',
  rate: 1000,
  miles: 300,
  rpm: 3.33,
  bookedAt: '2026-01-01T00:00:00.000Z',
  paymentStatus: 'unpaid',
  ...overrides,
});

describe('buildBrokerScorebook', () => {
  it('groups multiple loads under the same broker', () => {
    const history = [
      makeRecord({ id: 'A', brokerName: 'Broker X', rate: 1000 }),
      makeRecord({ id: 'B', brokerName: 'Broker X', rate: 2000 }),
      makeRecord({ id: 'C', brokerName: 'Broker Y', rate: 500 }),
    ];
    const result = buildBrokerScorebook(history);
    const brokerX = result.find((b) => b.brokerName === 'Broker X');
    expect(brokerX?.loadsBooked).toBe(2);
    expect(brokerX?.totalRevenue).toBe(3000);
  });

  it('gives a neutral score when there is no payment history yet', () => {
    const result = buildBrokerScorebook([makeRecord({ paymentStatus: 'unpaid' })]);
    expect(result[0].avgDaysToPay).toBeNull();
    expect(result[0].onTimePaymentRate).toBeNull();
    expect(result[0].reliabilityScore).toBe(70);
  });

  it('calculates real days-to-pay from invoice-sent to paid timestamps', () => {
    const record = makeRecord({
      paymentStatus: 'paid',
      invoiceSentAt: '2026-01-01T00:00:00.000Z',
      paidAt: '2026-01-06T00:00:00.000Z', // 5 days
    });
    const result = buildBrokerScorebook([record]);
    expect(result[0].avgDaysToPay).toBe(5);
    expect(result[0].onTimePaymentRate).toBe(100);
  });

  it('flags a broker who pays late as a lower on-time rate', () => {
    const fast = makeRecord({ id: 'FAST', paymentStatus: 'paid', invoiceSentAt: '2026-01-01T00:00:00.000Z', paidAt: '2026-01-05T00:00:00.000Z' });
    const slow = makeRecord({ id: 'SLOW', paymentStatus: 'paid', invoiceSentAt: '2026-01-01T00:00:00.000Z', paidAt: '2026-03-01T00:00:00.000Z' });
    const result = buildBrokerScorebook([fast, slow]);
    expect(result[0].onTimePaymentRate).toBe(50);
  });

  it('ranks brokers by reliability score, highest first', () => {
    const reliable = makeRecord({
      id: 'REL', brokerName: 'Reliable Co', paymentStatus: 'paid',
      invoiceSentAt: '2026-01-01T00:00:00.000Z', paidAt: '2026-01-03T00:00:00.000Z',
    });
    const slow = makeRecord({
      id: 'SLOW', brokerName: 'Slow Co', paymentStatus: 'paid',
      invoiceSentAt: '2026-01-01T00:00:00.000Z', paidAt: '2026-04-01T00:00:00.000Z',
    });
    const result = buildBrokerScorebook([slow, reliable]);
    expect(result[0].brokerName).toBe('Reliable Co');
  });
});
