import { describe, expect, it } from 'vitest';
import { scoreLoad } from '../workers/LoadScoringWorker';

describe('scoreLoad', () => {
  it('returns Diamond when RPM is above 3.50', () => {
    expect(scoreLoad({ id: 'diamond-load', rpm: 3.51 })).toBe('Diamond');
  });

  it('returns Gold when RPM is exactly 3.50', () => {
    expect(scoreLoad({ id: 'gold-upper', rpm: 3.5 })).toBe('Gold');
  });

  it('returns Gold when RPM is exactly 2.50', () => {
    expect(scoreLoad({ id: 'gold-lower', rpm: 2.5 })).toBe('Gold');
  });

  it('returns Standard when RPM is below 2.50', () => {
    expect(scoreLoad({ id: 'standard-load', rpm: 2.49 })).toBe('Standard');
  });

  it('throws on invalid inputs', () => {
    expect(() => scoreLoad({ id: '', rpm: 3.1 })).toThrow();
    expect(() => scoreLoad({ id: 'invalid-load', rpm: 0 })).toThrow();
    expect(() => scoreLoad({ id: 'invalid-load', rpm: Number.NaN })).toThrow();
  });
});
