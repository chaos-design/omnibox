import { getStorageKey, storageTools } from './tools';

export const storageStringifyParseValue = () => {
  return storageTools(getStorageKey('json_stringify_parse'));
};
