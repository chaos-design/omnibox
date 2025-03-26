import { getStorageKey, storageTools } from './tools';

export const storageStringifyParseValue = (key: string = '') => {
  return storageTools(getStorageKey(`menu_status_${key}`));
};
