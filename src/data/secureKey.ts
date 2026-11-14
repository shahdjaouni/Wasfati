import { Platform } from 'react-native';

export const API_KEY_STORAGE = 'tabkha_ai_api_key';

export async function readApiKey(): Promise<string | null> {
  const value = await read(API_KEY_STORAGE);
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function writeApiKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) {
    await remove(API_KEY_STORAGE);
    return;
  }
  await write(API_KEY_STORAGE, trimmed);
}

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(key, value);
}

async function remove(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(key);
}
