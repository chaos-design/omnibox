import { describe, expect, it } from 'vitest';

import {
  decodeBase64,
  decodeBase64Url,
  decodeHtmlEntities,
  decodeUrl,
  encodeBase64,
  encodeBase64Url,
  encodeHtmlEntities,
  encodeUrl,
} from './codec';

describe('codec tools', () => {
  it('round-trips Unicode text through Base64 variants', () => {
    const source = 'Omnibox 工具箱 🚀';

    expect(decodeBase64(encodeBase64(source))).toBe(source);
    expect(decodeBase64Url(encodeBase64Url(source))).toBe(source);
    expect(decodeBase64Url('SGVsbG8=')).toBe('Hello');
    expect(encodeBase64Url(source)).not.toMatch(/[+/=]/u);
  });

  it('rejects invalid Base64 and malformed URL input', () => {
    expect(() => decodeBase64('%%%')).toThrow('Base64');
    expect(() => decodeBase64Url('a+b')).toThrow('Base64URL');
    expect(() => decodeUrl('%E0%A4%A')).toThrow('URL 编码');
  });

  it('supports full URL and component encoding modes', () => {
    const source = 'https://example.com/你好?q=a b';

    expect(decodeUrl(encodeUrl(source, false), false)).toBe(source);
    expect(decodeUrl(encodeUrl(source))).toBe(source);
  });

  it('encodes special HTML characters and decodes named or numeric entities', () => {
    const source = `<span title="A&B">你好</span>`;

    expect(decodeHtmlEntities(encodeHtmlEntities(source))).toBe(source);
    expect(decodeHtmlEntities('&#20320;&#x597D;&nbsp;&unknown;')).toBe(
      '你好\u00a0&unknown;',
    );
  });
});
