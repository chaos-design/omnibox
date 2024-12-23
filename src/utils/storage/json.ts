import { getStorageKey, storageTools } from './tools';

export const storageStringifyParseValue = (key: string = '') => {
  return storageTools(getStorageKey(`json_stringify_parse${key}`));
};
