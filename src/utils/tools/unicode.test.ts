import { describe, expect, it } from 'vitest';

import {
  countUnicodeCodePoints,
  decodeUnicodeEscapes,
  encodeUnicodeEscapes,
  inspectUnicode,
  normalizeUnicode,
} from './unicode';

describe('Unicode tools', () => {
  it('inspects code points without splitting surrogate pairs', () => {
    const result = inspectUnicode('A🚀\u0301');

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      category: '字母',
      codePoint: 'U+0041',
      index: 0,
      utf8: '41',
    });
    expect(result[1]).toMatchObject({
      category: '符号',
      codePoint: 'U+1F680',
      index: 1,
      utf16: '\\uD83D\\uDE80',
    });
    expect(result[2]).toMatchObject({
      category: '组合标记',
      index: 3,
    });
    expect(inspectUnicode('ABC', 2)).toHaveLength(2);
    expect(countUnicodeCodePoints('A🚀')).toBe(2);
  });

  it('generates code point, UTF-16, and HTML escapes', () => {
    expect(encodeUnicodeEscapes('A🚀')).toEqual({
      codePoint: '\\u{41}\\u{1F680}',
      html: '&#x41;&#x1F680;',
      utf16: '\\u0041\\uD83D\\uDE80',
    });
  });

  it('decodes code point and surrogate-pair escapes', () => {
    expect(decodeUnicodeEscapes('\\u{1F680} \\u4F60\\u597D')).toBe('🚀 你好');
    expect(decodeUnicodeEscapes('\\uD83D\\uDE80')).toBe('🚀');
  });

  it('normalizes composed and compatibility forms', () => {
    expect(normalizeUnicode('e\u0301', 'NFC')).toBe('é');
    expect(normalizeUnicode('①', 'NFKC')).toBe('1');
    expect(normalizeUnicode('é', 'NFD')).toBe('e\u0301');
  });

  it('rejects malformed and unpaired escapes', () => {
    expect(() => decodeUnicodeEscapes('\\u12')).toThrow('4 个');
    expect(() => decodeUnicodeEscapes('\\u{110000}')).toThrow('标量范围');
    expect(() => decodeUnicodeEscapes('\\uD83D')).toThrow('低位代理项');
    expect(() => decodeUnicodeEscapes('\\uDE80')).toThrow('高位代理项');
  });
});
