import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

let secureStoreAvailable: boolean | null = null;
let secureStoreCheck: Promise<boolean> | null = null;

async function isSecureStoreAvailable() {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }

  if (!secureStoreCheck) {
    secureStoreCheck = SecureStore.isAvailableAsync()
      .then((result) => {
        secureStoreAvailable = result;
        return result;
      })
      .catch(() => {
        secureStoreAvailable = false;
        return false;
      });
  }

  return secureStoreCheck;
}

export async function getSessionItem(key: string) {
  if (await isSecureStoreAvailable()) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

export async function setSessionItem(key: string, value: string) {
  if (await isSecureStoreAvailable()) {
    return SecureStore.setItemAsync(key, value);
  }
  return AsyncStorage.setItem(key, value);
}

export async function deleteSessionItem(key: string) {
  if (await isSecureStoreAvailable()) {
    return SecureStore.deleteItemAsync(key);
  }
  return AsyncStorage.removeItem(key);
}
