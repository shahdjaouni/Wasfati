import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStore } from './repository';

export const deviceStorage: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
