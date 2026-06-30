import { describe, expect, it } from 'vitest';
import { executeBooking } from '../workers/AutoBookingEngine';

const mockLoad = {
  id: 'DAT-999',
  origin: { city: 'Dallas', state: 'TX', latitude: 32.7767, longitude: -96.797 },
  destination: { city: 'Atlanta', state: 'GA', latitude: 33.749, longitude: -84.388 },
  rate: 2925,
};

describe('executeBooking', () => {
  it('books load when broker credit score meets threshold', async () => {
    const result = await executeBooking(mockLoad, 80);
    expect(result.booked).toBe(true);
    expect(result.confirmationId).toContain('PHI-DAT-999');
    expect(result.bookedAt).not.toBeNull();
  });

  it('rejects when broker credit score is below threshold', async () => {
    const result = await executeBooking(mockLoad, 65);
    expect(result.booked).toBe(false);
    expect(result.confirmationId).toBeNull();
    expect(result.message).toContain('below PHI booking threshold');
  });

  it('accepts exact threshold score of 70', async () => {
    const result = await executeBooking(mockLoad, 70);
    expect(result.booked).toBe(true);
  });

  it('throws on invalid credit score', async () => {
    await expect(executeBooking(mockLoad, 150)).rejects.toThrow();
    await expect(executeBooking(mockLoad, -1)).rejects.toThrow();
    await expect(executeBooking(mockLoad, Number.NaN)).rejects.toThrow();
  });
});
