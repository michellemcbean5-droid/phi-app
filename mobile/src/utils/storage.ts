import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Storage keys
export const STORAGE_KEYS = {
  // Auth keys
  AUTH_TOKEN: 'phi_auth_token',
  REFRESH_TOKEN: 'phi_refresh_token',
  USER_DATA: 'phi_user_data',
  
  // App state keys
  WORKERS_STATE: 'phi_workers_state',
  LOADS_STATE: 'phi_loads_state',
  EARNINGS_STATE: 'phi_earnings_state',
  
  // Settings keys
  APP_SETTINGS: 'phi_app_settings',
  NOTIFICATION_SETTINGS: 'phi_notification_settings',
  
  // Cache keys
  DAT_RATES_CACHE: 'phi_dat_rates_cache',
  GOOGLE_MAPS_CACHE: 'phi_google_maps_cache',
  
  // Onboarding
  ONBOARDING_COMPLETED: 'phi_onboarding_completed',
  
  // Analytics
  LAST_SESSION: 'phi_last_session',
  USAGE_STATS: 'phi_usage_stats',
} as const;

type StorageKey = keyof typeof STORAGE_KEYS;

/**
 * Regular storage for non-sensitive data
 */
export const storage = {
  /**
   * Save data to regular storage
   */
  set: async <T>(key: StorageKey, value: T): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(STORAGE_KEYS[key], jsonValue);
    } catch (error) {
      console.error(`Failed to save ${key} to storage:`, error);
      throw new Error(`Storage save failed for ${key}`);
    }
  },

  /**
   * Get data from regular storage
   */
  get: async <T>(key: StorageKey): Promise<T | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS[key]);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Failed to get ${key} from storage:`, error);
      return null;
    }
  },

  /**
   * Remove data from regular storage
   */
  remove: async (key: StorageKey): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS[key]);
    } catch (error) {
      console.error(`Failed to remove ${key} from storage:`, error);
      throw new Error(`Storage remove failed for ${key}`);
    }
  },

  /**
   * Clear all storage
   */
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error('Storage clear failed');
    }
  },

  /**
   * Get all keys from storage
   */
  getAllKeys: async (): Promise<string[]> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys;
    } catch (error) {
      console.error('Failed to get all keys from storage:', error);
      return [];
    }
  },

  /**
   * Multi-get from storage
   */
  multiGet: async <T>(keys: StorageKey[]): Promise<Record<StorageKey, T | null>> => {
    try {
      const storageKeys = keys.map(key => STORAGE_KEYS[key]);
      const results = await AsyncStorage.multiGet(storageKeys);
      
      return results.reduce((acc, [key, value]) => {
        const storageKey = Object.entries(STORAGE_KEYS).find(
          ([, v]) => v === key
        )?.[0] as StorageKey | undefined;
        
        if (storageKey) {
          acc[storageKey] = value ? JSON.parse(value) : null;
        }
        return acc;
      }, {} as Record<StorageKey, T | null>);
    } catch (error) {
      console.error('Failed to multi-get from storage:', error);
      return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {} as Record<StorageKey, T | null>);
    }
  },
};

/**
 * Secure storage for sensitive data (tokens, credentials)
 */
export const secureStorage = {
  /**
   * Save sensitive data to secure storage
   */
  set: async (key: StorageKey, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS[key], value);
    } catch (error) {
      console.error(`Failed to save ${key} to secure storage:`, error);
      throw new Error(`Secure storage save failed for ${key}`);
    }
  },

  /**
   * Get sensitive data from secure storage
   */
  get: async (key: StorageKey): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS[key]);
    } catch (error) {
      console.error(`Failed to get ${key} from secure storage:`, error);
      return null;
    }
  },

  /**
   * Remove sensitive data from secure storage
   */
  remove: async (key: StorageKey): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS[key]);
    } catch (error) {
      console.error(`Failed to remove ${key} from secure storage:`, error);
      throw new Error(`Secure storage remove failed for ${key}`);
    }
  },

  /**
   * Check if secure storage is available
   */
  isAvailable: async (): Promise<boolean> => {
    try {
      return await SecureStore.isAvailableAsync();
    } catch (error) {
      console.error('Failed to check secure storage availability:', error);
      return false;
    }
  },
};

/**
 * Cache utility with TTL (Time To Live)
 */
export const cache = {
  /**
   * Set cached data with TTL
   */
  set: async <T>(key: StorageKey, value: T, ttl: number = 3600): Promise<void> => {
    try {
      const cacheData = {
        data: value,
        expiresAt: Date.now() + ttl * 1000, // Convert seconds to milliseconds
      };
      await storage.set(key, cacheData);
    } catch (error) {
      console.error(`Failed to set cache for ${key}:`, error);
      throw new Error(`Cache set failed for ${key}`);
    }
  },

  /**
   * Get cached data, returns null if expired
   */
  get: async <T>(key: StorageKey): Promise<T | null> => {
    try {
      const cacheData = await storage.get<{ data: T; expiresAt: number }>(key);
      
      if (!cacheData) {
        return null;
      }

      // Check if cache has expired
      if (Date.now() > cacheData.expiresAt) {
        await storage.remove(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error(`Failed to get cache for ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove cached data
   */
  remove: async (key: StorageKey): Promise<void> => {
    await storage.remove(key);
  },

  /**
   * Clear all expired cache
   */
  clearExpired: async (): Promise<void> => {
    try {
      const allKeys = await storage.getAllKeys();
      const cacheKeys = allKeys.filter(key => 
        Object.values(STORAGE_KEYS).includes(key) && 
        key.includes('CACHE')
      );

      for (const key of cacheKeys) {
        const cacheData = await storage.get<{ expiresAt: number }>(key as StorageKey);
        if (cacheData && Date.now() > cacheData.expiresAt) {
          await storage.remove(key as StorageKey);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  },
};

/**
 * Session storage for temporary data
 */
export const sessionStorage = {
  /**
   * Save session data
   */
  set: async <T>(key: string, value: T): Promise<void> => {
    try {
      const sessionData = {
        data: value,
        createdAt: Date.now(),
      };
      await storage.set('SESSION_DATA' as StorageKey, sessionData);
    } catch (error) {
      console.error('Failed to save session data:', error);
      throw new Error('Session storage save failed');
    }
  },

  /**
   * Get session data
   */
  get: async <T>(): Promise<T | null> => {
    try {
      const sessionData = await storage.get<{ data: T; createdAt: number }>('SESSION_DATA' as StorageKey);
      return sessionData?.data || null;
    } catch (error) {
      console.error('Failed to get session data:', error);
      return null;
    }
  },

  /**
   * Clear session data
   */
  clear: async (): Promise<void> => {
    await storage.remove('SESSION_DATA' as StorageKey);
  },
};

export default {
  storage,
  secureStorage,
  cache,
  sessionStorage,
  STORAGE_KEYS,
};
