// Secure API key store — wraps expo-secure-store for hardware-backed storage.
// Falls back to encrypted AsyncStorage when SecureStore is unavailable (web/emulator).

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptSensitiveData, decryptSensitiveData } from './encryption';

const SECURE_PREFIX = 'phi_secure_';

const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const storeKey = async (name: string, value: string): Promise<void> => {
  const fullKey = SECURE_PREFIX + name;
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(fullKey, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return;
    }
  } catch {
    // Fall through to AsyncStorage fallback
  }
  // Encrypted AsyncStorage fallback
  const encrypted = encryptSensitiveData(value);
  await AsyncStorage.setItem(fullKey, encrypted);
};

export const retrieveKey = async (name: string): Promise<string | null> => {
  const fullKey = SECURE_PREFIX + name;
  try {
    if (await isSecureStoreAvailable()) {
      return await SecureStore.getItemAsync(fullKey);
    }
  } catch {
    // Fall through
  }
  const stored = await AsyncStorage.getItem(fullKey);
  if (!stored) return null;
  try {
    return decryptSensitiveData(stored);
  } catch {
    return null;
  }
};

export const deleteKey = async (name: string): Promise<void> => {
  const fullKey = SECURE_PREFIX + name;
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(fullKey);
    }
  } catch {
    // Ignore
  }
  await AsyncStorage.removeItem(fullKey);
};
