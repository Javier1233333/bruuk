import type { IStorageAdapter } from '@bruuk/shared-logic/adapters';

export const storageAdapter: IStorageAdapter = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('Error reading from localStorage', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn('Error writing to localStorage', error);
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Error removing from localStorage', error);
    }
  }
};
