import { z } from 'zod';

// Load validation schema
export const LoadSchema = z.object({
  id: z.string().min(1, 'Load ID is required'),
  source: z.enum(['DAT', 'Truckstop']),
  equipmentType: z.enum(['Dry Van', 'Reefer', 'Flatbed']),
  brokerName: z.string().min(1, 'Broker name is required'),
  brokerRating: z.number().min(0).max(5, 'Broker rating must be between 0 and 5'),
  origin: z.object({
    city: z.string().min(1, 'Origin city is required'),
    state: z.string().min(2, 'Origin state is required').max(2, 'State must be 2 characters'),
    latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  }),
  destination: z.object({
    city: z.string().min(1, 'Destination city is required'),
    state: z.string().min(2, 'Destination state is required').max(2, 'State must be 2 characters'),
    latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  }),
  pickupDate: z.string().datetime('Invalid pickup date format'),
  deliveryDate: z.string().datetime('Invalid delivery date format'),
  rate: z.number().positive('Rate must be positive'),
  miles: z.number().positive('Miles must be positive'),
  rpm: z.number().positive('RPM must be positive'),
  totalMiles: z.number().positive('Total miles must be positive'),
  weightLbs: z.number().positive('Weight must be positive'),
  tasksToday: z.number().nonnegative('Tasks today cannot be negative').optional(),
});

export type Load = z.infer<typeof LoadSchema>;

// Worker validation schema
export const WorkerSchema = z.object({
  id: z.string().min(1, 'Worker ID is required'),
  name: z.string().min(1, 'Worker name is required'),
  status: z.enum(['active', 'idle', 'error']),
  tasksToday: z.number().nonnegative('Tasks today cannot be negative'),
  revenueImpact: z.number().nonnegative('Revenue impact cannot be negative'),
  lastHeartbeat: z.string().datetime('Invalid heartbeat timestamp'),
});

export type Worker = z.infer<typeof WorkerSchema>;

// User validation schema
export const UserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  role: z.enum(['driver', 'dispatcher', 'admin']).optional(),
  subscriptionTier: z.enum(['free', 'pro', 'enterprise']).optional(),
});

export type User = z.infer<typeof UserSchema>;

// Auth validation schema
export const AuthSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type AuthCredentials = z.infer<typeof AuthSchema>;

// Profit calculation validation
export const ProfitInputSchema = z.object({
  revenue: z.number().positive('Revenue must be positive'),
  fuel: z.number().nonnegative('Fuel cost cannot be negative'),
  maintenance: z.number().nonnegative('Maintenance cost cannot be negative'),
  insurance: z.number().nonnegative('Insurance cost cannot be negative'),
  expenses: z.number().nonnegative('Expenses cannot be negative'),
});

export type ProfitInput = z.infer<typeof ProfitInputSchema>;

// Validation utility functions
export const validateLoad = (data: unknown): Load => {
  try {
    return LoadSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Load validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw new Error('Load validation failed');
  }
};

export const validateWorker = (data: unknown): Worker => {
  try {
    return WorkerSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Worker validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw new Error('Worker validation failed');
  }
};

export const validateUser = (data: unknown): User => {
  try {
    return UserSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`User validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw new Error('User validation failed');
  }
};

export const validateAuthCredentials = (data: unknown): AuthCredentials => {
  try {
    return AuthSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Auth validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw new Error('Auth validation failed');
  }
};

export const validateProfitInput = (data: unknown): ProfitInput => {
  try {
    return ProfitInputSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Profit input validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw new Error('Profit input validation failed');
  }
};

// Safe parsing functions that return null instead of throwing
export const safeParseLoad = (data: unknown): Load | null => {
  const result = LoadSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeParseWorker = (data: unknown): Worker | null => {
  const result = WorkerSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeParseUser = (data: unknown): User | null => {
  const result = UserSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeParseAuthCredentials = (data: unknown): AuthCredentials | null => {
  const result = AuthSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeParseProfitInput = (data: unknown): ProfitInput | null => {
  const result = ProfitInputSchema.safeParse(data);
  return result.success ? result.data : null;
};
