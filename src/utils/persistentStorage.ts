import { Platform } from 'react-native';

export type StorageAPI = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

let storage: StorageAPI;

if (Platform.OS === 'web') {
  storage = {
    async getItem(key: string) {
      try {
        return Promise.resolve(localStorage.getItem(key));
      } catch (error) {
        console.warn(`localStorage.getItem failed for key ${key}`, error);
        return null;
      }
    },
    async setItem(key: string, value: string) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn(`localStorage.setItem failed for key ${key}`, error);
      }
    },
    async removeItem(key: string) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`localStorage.removeItem failed for key ${key}`, error);
      }
    },
  };
} else {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
    removeItem: AsyncStorage.removeItem,
  };
}

export default storage;
