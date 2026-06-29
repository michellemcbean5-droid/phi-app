import { describe, expect, it } from 'vitest';
import {
  LoadSchema,
  WorkerSchema,
  UserSchema,
  AuthSchema,
  ProfitInputSchema,
  validateLoad,
  validateWorker,
  validateUser,
  validateAuthCredentials,
  validateProfitInput,
  safeParseLoad,
  safeParseWorker,
  safeParseUser,
  safeParseAuthCredentials,
  safeParseProfitInput,
} from '../utils/validation';

describe('Validation Schemas', () => {
  describe('LoadSchema', () => {
    it('should validate a valid load', () => {
      const validLoad = {
        id: 'load-123',
        source: 'DAT' as const,
        equipmentType: 'Dry Van' as const,
        brokerName: 'Acme Freight',
        brokerRating: 4.5,
        origin: {
          city: 'Dallas',
          state: 'TX',
          latitude: 32.7767,
          longitude: -96.7970,
        },
        destination: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7490,
          longitude: -84.3880,
        },
        pickupDate: '2024-01-15T08:00:00Z',
        deliveryDate: '2024-01-16T18:00:00Z',
        rate: 2500,
        miles: 781,
        rpm: 3.20,
        totalMiles: 781,
        weightLbs: 42000,
        tasksToday: 5,
      };

      const result = LoadSchema.safeParse(validLoad);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject load with empty ID', () => {
      const invalidLoad = {
        id: '',
        source: 'DAT' as const,
        equipmentType: 'Dry Van' as const,
        brokerName: 'Acme Freight',
        brokerRating: 4.5,
        origin: {
          city: 'Dallas',
          state: 'TX',
          latitude: 32.7767,
          longitude: -96.7970,
        },
        destination: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7490,
          longitude: -84.3880,
        },
        pickupDate: '2024-01-15T08:00:00Z',
        deliveryDate: '2024-01-16T18:00:00Z',
        rate: 2500,
        miles: 781,
        rpm: 3.20,
        totalMiles: 781,
        weightLbs: 42000,
      };

      const result = LoadSchema.safeParse(invalidLoad);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Load ID is required');
    });

    it('should reject load with invalid broker rating', () => {
      const invalidLoad = {
        id: 'load-123',
        source: 'DAT' as const,
        equipmentType: 'Dry Van' as const,
        brokerName: 'Acme Freight',
        brokerRating: 6, // Invalid: > 5
        origin: {
          city: 'Dallas',
          state: 'TX',
          latitude: 32.7767,
          longitude: -96.7970,
        },
        destination: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7490,
          longitude: -84.3880,
        },
        pickupDate: '2024-01-15T08:00:00Z',
        deliveryDate: '2024-01-16T18:00:00Z',
        rate: 2500,
        miles: 781,
        rpm: 3.20,
        totalMiles: 781,
        weightLbs: 42000,
      };

      const result = LoadSchema.safeParse(invalidLoad);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Broker rating must be between 0 and 5');
    });

    it('should reject load with negative rate', () => {
      const invalidLoad = {
        id: 'load-123',
        source: 'DAT' as const,
        equipmentType: 'Dry Van' as const,
        brokerName: 'Acme Freight',
        brokerRating: 4.5,
        origin: {
          city: 'Dallas',
          state: 'TX',
          latitude: 32.7767,
          longitude: -96.7970,
        },
        destination: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7490,
          longitude: -84.3880,
        },
        pickupDate: '2024-01-15T08:00:00Z',
        deliveryDate: '2024-01-16T18:00:00Z',
        rate: -100, // Invalid: negative
        miles: 781,
        rpm: 3.20,
        totalMiles: 781,
        weightLbs: 42000,
      };

      const result = LoadSchema.safeParse(invalidLoad);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Rate must be positive');
    });

    it('should reject load with invalid latitude', () => {
      const invalidLoad = {
        id: 'load-123',
        source: 'DAT' as const,
        equipmentType: 'Dry Van' as const,
        brokerName: 'Acme Freight',
        brokerRating: 4.5,
        origin: {
          city: 'Dallas',
          state: 'TX',
          latitude: 100, // Invalid: > 90
          longitude: -96.7970,
        },
        destination: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7490,
          longitude: -84.3880,
        },
        pickupDate: '2024-01-15T08:00:00Z',
        deliveryDate: '2024-01-16T18:00:00Z',
        rate: 2500,
        miles: 781,
        rpm: 3.20,
        totalMiles: 781,
        weightLbs: 42000,
      };

      const result = LoadSchema.safeParse(invalidLoad);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Latitude must be between -90 and 90');
    });
  });

  describe('WorkerSchema', () => {
    it('should validate a valid worker', () => {
      const validWorker = {
        id: 'worker-123',
        name: 'LoadFinderWorker',
        status: 'active' as const,
        tasksToday: 10,
        revenueImpact: 1000,
        lastHeartbeat: '2024-01-15T12:00:00Z',
      };

      const result = WorkerSchema.safeParse(validWorker);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject worker with empty ID', () => {
      const invalidWorker = {
        id: '',
        name: 'LoadFinderWorker',
        status: 'active' as const,
        tasksToday: 10,
        revenueImpact: 1000,
        lastHeartbeat: '2024-01-15T12:00:00Z',
      };

      const result = WorkerSchema.safeParse(invalidWorker);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Worker ID is required');
    });

    it('should reject worker with negative tasksToday', () => {
      const invalidWorker = {
        id: 'worker-123',
        name: 'LoadFinderWorker',
        status: 'active' as const,
        tasksToday: -5, // Invalid: negative
        revenueImpact: 1000,
        lastHeartbeat: '2024-01-15T12:00:00Z',
      };

      const result = WorkerSchema.safeParse(invalidWorker);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Tasks today cannot be negative');
    });

    it('should reject worker with invalid status', () => {
      const invalidWorker = {
        id: 'worker-123',
        name: 'LoadFinderWorker',
        status: 'invalid-status' as const, // Invalid status
        tasksToday: 10,
        revenueImpact: 1000,
        lastHeartbeat: '2024-01-15T12:00:00Z',
      };

      const result = WorkerSchema.safeParse(invalidWorker);
      expect(result.success).toBe(false);
    });
  });

  describe('UserSchema', () => {
    it('should validate a valid user', () => {
      const validUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '5551234567',
        role: 'driver' as const,
        subscriptionTier: 'pro' as const,
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject user with invalid email', () => {
      const invalidUser = {
        id: 'user-123',
        email: 'invalid-email', // Invalid email format
        name: 'Test User',
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Invalid email format');
    });

    it('should reject user with empty ID', () => {
      const invalidUser = {
        id: '',
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('User ID is required');
    });
  });

  describe('AuthSchema', () => {
    it('should validate valid credentials', () => {
      const validCredentials = {
        email: 'test@example.com',
        password: 'securePassword123',
      };

      const result = AuthSchema.safeParse(validCredentials);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject short password', () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'short', // Too short
      };

      const result = AuthSchema.safeParse(invalidCredentials);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Password must be at least 8 characters');
    });

    it('should reject invalid email', () => {
      const invalidCredentials = {
        email: 'invalid-email',
        password: 'securePassword123',
      };

      const result = AuthSchema.safeParse(invalidCredentials);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Invalid email format');
    });
  });

  describe('ProfitInputSchema', () => {
    it('should validate valid profit input', () => {
      const validInput = {
        revenue: 5000,
        fuel: 1200,
        maintenance: 300,
        insurance: 250,
        expenses: 150,
      };

      const result = ProfitInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject negative revenue', () => {
      const invalidInput = {
        revenue: -1000, // Invalid: negative
        fuel: 1200,
        maintenance: 300,
        insurance: 250,
        expenses: 150,
      };

      const result = ProfitInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Revenue must be positive');
    });

    it('should reject negative costs', () => {
      const invalidInput = {
        revenue: 5000,
        fuel: -100, // Invalid: negative
        maintenance: 300,
        insurance: 250,
        expenses: 150,
      };

      const result = ProfitInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Fuel cost cannot be negative');
    });
  });
});

describe('Validation Functions', () => {
  describe('validateLoad', () => {
    it('should validate and return a valid load', () => {
      const validLoad = {
        id: 'load-123',
        source: 'DAT' as const,
        equipmentType: 'Dry Van' as const,
        brokerName: 'Acme Freight',
        brokerRating: 4.5,
        origin: {
          city: 'Dallas',
          state: 'TX',
          latitude: 32.7767,
          longitude: -96.7970,
        },
        destination: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7490,
          longitude: -84.3880,
        },
        pickupDate: '2024-01-15T08:00:00Z',
        deliveryDate: '2024-01-16T18:00:00Z',
        rate: 2500,
        miles: 781,
        rpm: 3.20,
        totalMiles: 781,
        weightLbs: 42000,
      };

      const result = validateLoad(validLoad);
      expect(result).toBeDefined();
      expect(result.id).toBe('load-123');
    });

    it('should throw error for invalid load', () => {
      const invalidLoad = {
        id: '',
        source: 'DAT' as const,
        equipmentType: 'Dry Van' as const,
        brokerName: 'Acme Freight',
        brokerRating: 4.5,
        origin: {
          city: 'Dallas',
          state: 'TX',
          latitude: 32.7767,
          longitude: -96.7970,
        },
        destination: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7490,
          longitude: -84.3880,
        },
        pickupDate: '2024-01-15T08:00:00Z',
        deliveryDate: '2024-01-16T18:00:00Z',
        rate: 2500,
        miles: 781,
        rpm: 3.20,
        totalMiles: 781,
        weightLbs: 42000,
      };

      expect(() => validateLoad(invalidLoad)).toThrow();
    });
  });

  describe('safeParseLoad', () => {
    it('should return parsed data for valid load', () => {
      const validLoad = {
        id: 'load-123',
        source: 'DAT' as const,
        equipmentType: 'Dry Van' as const,
        brokerName: 'Acme Freight',
        brokerRating: 4.5,
        origin: {
          city: 'Dallas',
          state: 'TX',
          latitude: 32.7767,
          longitude: -96.7970,
        },
        destination: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7490,
          longitude: -84.3880,
        },
        pickupDate: '2024-01-15T08:00:00Z',
        deliveryDate: '2024-01-16T18:00:00Z',
        rate: 2500,
        miles: 781,
        rpm: 3.20,
        totalMiles: 781,
        weightLbs: 42000,
      };

      const result = safeParseLoad(validLoad);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('load-123');
    });

    it('should return null for invalid load', () => {
      const invalidLoad = {
        id: '',
        source: 'DAT' as const,
        equipmentType: 'Dry Van' as const,
        brokerName: 'Acme Freight',
        brokerRating: 4.5,
        origin: {
          city: 'Dallas',
          state: 'TX',
          latitude: 32.7767,
          longitude: -96.7970,
        },
        destination: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7490,
          longitude: -84.3880,
        },
        pickupDate: '2024-01-15T08:00:00Z',
        deliveryDate: '2024-01-16T18:00:00Z',
        rate: 2500,
        miles: 781,
        rpm: 3.20,
        totalMiles: 781,
        weightLbs: 42000,
      };

      const result = safeParseLoad(invalidLoad);
      expect(result).toBeNull();
    });
  });
});
