import { describe, expect, it } from 'vitest';

import { generateHmac } from './hmac';

describe('HMAC tools', () => {
  it('matches the standard HMAC-SHA-256 vector', async () => {
    await expect(
      generateHmac('The quick brown fox jumps over the lazy dog', 'key'),
    ).resolves.toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    );
  });

  it('accepts equivalent text and hexadecimal keys', async () => {
    const text = await generateHmac('message', 'key', {
      algorithm: 'SHA-384',
    });
    const hexadecimal = await generateHmac('message', '6b6579', {
      algorithm: 'SHA-384',
      keyEncoding: 'hex',
    });

    expect(hexadecimal).toBe(text);
  });

  it('supports Base64 output', async () => {
    await expect(
      generateHmac('message', 'key', { output: 'base64' }),
    ).resolves.toMatch(/^[A-Za-z\d+/]+={0,2}$/u);
  });

  it('rejects empty and malformed hexadecimal keys', async () => {
    await expect(generateHmac('message', '')).rejects.toThrow('不能为空');
    await expect(
      generateHmac('message', 'abc', { keyEncoding: 'hex' }),
    ).rejects.toThrow('偶数个');
    await expect(
      generateHmac('message', 'zz', { keyEncoding: 'hex' }),
    ).rejects.toThrow('十六进制');
  });
});
