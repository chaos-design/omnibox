import { SLOGAN_NAME } from '../constant';

export const getStorageKey = (key: string) =>
  `${SLOGAN_NAME}_${key}`.toUpperCase();

export const storageTools = (key: string) => {
  if (typeof window === 'undefined') {
    return {
      getStorageKey() {
        return '';
      },
      getItem() {
        return null;
      },
      setItem(value: any) {},
      removeItem() {},
      clear() {},
    };
  }

  return {
    getStorageKey() {
      return getStorageKey(key);
    },
    getItem() {
      const value = window?.localStorage?.getItem?.(key);
      if (value) {
        return JSON.parse(value);
      }

      return null;
    },
    setItem(value: any) {
      window?.localStorage?.setItem?.(key, JSON.stringify(value));
    },
    removeItem() {
      window?.localStorage?.removeItem?.(key);
    },
    clear() {
      window?.localStorage?.clear?.();
    },
  };
};
