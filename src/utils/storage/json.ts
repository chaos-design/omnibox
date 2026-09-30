import { getStorageKey, storageTools } from './tools';

export const storageStringifyParseValue = <T = string>(key: string = '') => {
  return storageTools<T>(getStorageKey(`json_stringify_parse_${key}`));
};
