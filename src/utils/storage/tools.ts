import { SLOGAN_NAME } from '../constant';

export const getStorageKey = (key: string) =>
  `${SLOGAN_NAME}_${key}`.toUpperCase();

export interface StorageResult<T> {
  value: T | null;
  error: Error | null;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export const storageTools = <T>(key: string) => {
  const read = (): StorageResult<T> => {
    if (typeof window === 'undefined') {
      return { value: null, error: null };
    }

    try {
      const value = window.localStorage.getItem(key);

      return {
        value: value === null ? null : (JSON.parse(value) as T),
        error: null,
      };
    } catch (error) {
      return { value: null, error: toError(error) };
    }
  };

  const write = (value: T): Error | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return null;
    } catch (error) {
      return toError(error);
    }
  };

  const remove = (): Error | null => {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      window.localStorage.removeItem(key);
      return null;
    } catch (error) {
      return toError(error);
    }
  };

  return {
    getStorageKey() {
      return key;
    },
    read,
    getItem() {
      return read().value;
    },
    setItem(value: T) {
      return write(value);
    },
    removeItem() {
      return remove();
    },
  };
};
