import { describe, expect, it } from 'vitest';

import { generateRandomString, generateUuid, hashText } from './hash-random';

describe('hash and random tools', () => {
  it('calculates standard SHA digests', async () => {
    await expect(hashText('abc', 'SHA-256')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    await expect(hashText('', 'SHA-1')).resolves.toBe(
      'da39a3ee5e6b4b0d3255bfef95601890afd80709',
    );
  });

  it('generates valid UUID v4 values', () => {
    expect(generateUuid()).toMatch(
      /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u,
    );
  });

  it('generates random strings from the requested alphabet', () => {
    const value = generateRandomString(64, 'ABC123');

    expect(value).toHaveLength(64);
    expect(value).toMatch(/^[ABC123]+$/u);
  });

  it('rejects unsafe random string settings', () => {
    expect(() => generateRandomString(0, 'abc')).toThrow('1 到 4096');
    expect(() => generateRandomString(10, 'a')).toThrow('字符集');
    expect(() => generateRandomString(10, 'aab')).toThrow('不重复');
  });
});
