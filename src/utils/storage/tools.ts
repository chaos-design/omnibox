import { SLOGAN_NAME } from '../constant';

export const getStorageKey = (key: string) =>
  `${SLOGAN_NAME}_${key}`.toUpperCase();

export const storageTools = (key: string) => {
  return {
    getStorageKey() {
      return getStorageKey(key);
    },
    getItem() {
      const value = localStorage.getItem(key);
      if (value) {
        return JSON.parse(value);
      }

      return null;
    },
    setItem(value: any) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem() {
      localStorage.removeItem(key);
    },
    clear() {
      localStorage.clear();
    },
  };
};
