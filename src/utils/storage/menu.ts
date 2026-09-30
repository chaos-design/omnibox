import { getStorageKey, storageTools } from './tools';

export const storageStringifyParseValue = (key: string = '') => {
  return storageTools<boolean>(getStorageKey(`menu_status_${key}`));
};
