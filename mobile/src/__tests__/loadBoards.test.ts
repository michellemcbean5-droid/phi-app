import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchTruckstopLoads } from '../api/truckstopConnector';
import { fetchAmazonRelayLoads } from '../api/amazonRelayConnector';
import { fetchCoyoteLoads } from '../api/coyoteConnector';
import { scoreLoad } from '../workers/LoadScoringWorker';
import { getProfitabilityScore, getBrokerReliabilityLabel } from '../api/aiService';

// Mock claudeClient so no real API calls happen
vi.mock('../api/claudeClient', () => ({
  isClaudeConfigured: () => false,
  askClaudeJSON: vi.fn().mockRejectedValue(new Error('not configured')),
  askClaude: vi.fn().mockRejectedValue(new Error('not configured')),
}));

// Mock expo-constants
vi.mock('expo-constants', () => ({
  default: { expoConfig: { extra: {} } },
}));

describe('Load board connectors — fallback mode', () => {
  it('fetchTruckstopLoads returns static loads when unconfigured', async () => {
    const loads = await fetchTruckstopLoads();
    expect(loads.length).toBeGreaterThan(0);
    loads.forEach((l) => {
      expect(l.id).toMatch(/^TS-/);
      expect(l.source).toBe('Truckstop');
      expect(l.rpm).toBeGreaterThan(0);
    });
  });

  it('fetchAmazonRelayLoads returns static loads when unconfigured', async () => {
    const loads = await fetchAmazonRelayLoads();
    expect(loads.length).toBeGreaterThan(0);
    loads.forEach((l) => {
      expect(l.id).toMatch(/^RELAY-/);
      expect(l.brokerName).toBe('Amazon Relay (Direct)');
      expect(l.brokerRating).toBe(4.9);
    });
  });

  it('fetchCoyoteLoads returns static loads when unconfigured', async () => {
    const loads = await fetchCoyoteLoads();
    expect(loads.length).toBeGreaterThan(0);
    loads.forEach((l) => {
      expect(l.id).toMatch(/^COYOTE-/);
      expect(l.brokerName).toBe('Coyote Logistics');
    });
  });
});

describe('Load scoring', () => {
  it('scores Diamond for RPM > 3.5', () => {
    expect(scoreLoad({ id: 'X1', rpm: 3.6 })).toBe('Diamond');
  });
  it('scores Gold for RPM 2.5-3.5', () => {
    expect(scoreLoad({ id: 'X2', rpm: 3.0 })).toBe('Gold');
  });
  it('scores Standard for RPM < 2.5', () => {
    expect(scoreLoad({ id: 'X3', rpm: 2.0 })).toBe('Standard');
  });
  it('throws on invalid load', () => {
    expect(() => scoreLoad({ id: '', rpm: 3.0 })).toThrow();
    expect(() => scoreLoad({ id: 'X4', rpm: -1 })).toThrow();
  });
});

describe('AI service utilities', () => {
  it('getProfitabilityScore returns 95 for high net RPM', () => {
    const load = {
      id: 'X', source: 'DAT' as const, equipmentType: 'Dry Van' as const,
      brokerName: 'Test', brokerRating: 4.5,
      origin: { city: 'A', state: 'TX', latitude: 0, longitude: 0 },
      destination: { city: 'B', state: 'GA', latitude: 0, longitude: 0 },
      pickupDate: '2026-01-01', deliveryDate: '2026-01-02',
      rate: 3000, miles: 800, rpm: 3.75, totalMiles: 800, weightLbs: 40000,
    };
    const score = getProfitabilityScore(load, 0.65);
    expect(score).toBeGreaterThan(80);
  });

  it('getBrokerReliabilityLabel returns Top Rated for 4.7+', () => {
    expect(getBrokerReliabilityLabel(4.8).label).toBe('Top Rated');
    expect(getBrokerReliabilityLabel(4.0).label).toBe('Good');
    expect(getBrokerReliabilityLabel(3.5).label).toBe('Verify');
  });
});

describe('Feature flags', () => {
  it('loads default flags', async () => {
    const { loadFeatureFlags, isEnabled, getAllFlags } = await import('../config/featureFlags');
    await loadFeatureFlags();
    expect(isEnabled('realtime_loads')).toBe(true);
    expect(isEnabled('amazon_relay')).toBe(true);
    const all = getAllFlags();
    expect(all).toHaveProperty('truckstop_board');
  });
});
