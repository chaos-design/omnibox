import { describe, expect, it } from 'vitest';

import {
  dataUrlToBlob,
  decodeDataUrlText,
  encodeBytesDataUrl,
  encodeTextDataUrl,
  parseDataUrl,
} from './data-url';

describe('Data URL tools', () => {
  it('round-trips Unicode text with percent and Base64 encoding', () => {
    const source = 'Omnibox 工具箱 🚀';
    const percent = encodeTextDataUrl(source);
    const base64 = encodeTextDataUrl(source, 'text/plain', true);

    expect(decodeDataUrlText(percent)).toBe(source);
    expect(decodeDataUrlText(base64)).toBe(source);
    expect(parseDataUrl(base64)).toMatchObject({
      base64: true,
      charset: 'UTF-8',
      mediaType: 'text/plain',
    });
  });

  it('encodes and parses arbitrary binary bytes', async () => {
    const input = Uint8Array.from([0, 1, 127, 128, 255]);
    const url = encodeBytesDataUrl(input, 'application/octet-stream');
    const parsed = parseDataUrl(url);
    const blob = dataUrlToBlob(url);

    expect(Array.from(parsed.bytes)).toEqual(Array.from(input));
    expect(parsed.size).toBe(5);
    expect(blob.type).toBe('application/octet-stream');
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual(
      Array.from(input),
    );
  });

  it('uses the default media type for empty metadata', () => {
    expect(parseDataUrl('data:,hello')).toMatchObject({
      base64: false,
      mediaType: 'text/plain',
      size: 5,
    });
  });

  it('decodes unescaped non-BMP Unicode without splitting surrogate pairs', () => {
    expect(decodeDataUrlText('data:text/plain;charset=UTF-8,🚀')).toBe('🚀');
  });

  it('rejects malformed MIME, percent, and Base64 data', () => {
    expect(() => parseDataUrl('hello')).toThrow('data:');
    expect(() => parseDataUrl('data:text/plain')).toThrow('逗号');
    expect(() => parseDataUrl('data:bad,hello')).toThrow('MIME');
    expect(() => parseDataUrl('data:text/plain,%A')).toThrow('百分号');
    expect(() => parseDataUrl('data:text/plain;base64,%%%')).toThrow('Base64');
  });
});
