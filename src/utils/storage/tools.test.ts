// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getStorageKey, storageTools } from './tools';

describe('storage tools', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reads and writes namespaced values', () => {
    const key = getStorageKey('settings');
    const storage = storageTools<{ compact: boolean }>(key);

    expect(storage.setItem({ compact: true })).toBeNull();
    expect(storage.getItem()).toEqual({ compact: true });
    expect(storage.getStorageKey()).toBe('OMNIBOX_SETTINGS');
  });

  it('returns an error-first result for corrupted data', () => {
    localStorage.setItem('BROKEN', '{');

    const result = storageTools<unknown>('BROKEN').read();

    expect(result.value).toBeNull();
    expect(result.error).toBeInstanceOf(SyntaxError);
  });

  it('removes only its own key', () => {
    localStorage.setItem('OTHER_APP', '"keep"');
    const storage = storageTools<string>('OMNIBOX_TEMP');
    storage.setItem('remove');

    expect(storage.removeItem()).toBeNull();
    expect(localStorage.getItem('OMNIBOX_TEMP')).toBeNull();
    expect(localStorage.getItem('OTHER_APP')).toBe('"keep"');
  });
});
