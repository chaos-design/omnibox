import { describe, expect, it } from 'vitest';

import { generateHttpRequest, parseHeadersJson } from './http-builder';

describe('HTTP builder tools', () => {
  it('generates cURL, Fetch, and raw HTTP requests', () => {
    const result = generateHttpRequest({
      body: `{"name":"O'Reilly"}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Token': 'secret',
      },
      method: 'post',
      url: 'https://example.com:8443/api?q=1',
    });

    expect(result.curl).toContain('curl -X POST');
    expect(result.curl).toContain("O'\\''Reilly");
    expect(result.fetch).toContain(
      'await fetch("https://example.com:8443/api?q=1"',
    );
    expect(result.fetch).toContain('"Content-Type": "application/json"');
    expect(result.fetch).toContain("get('content-type') ?? '').toLowerCase()");
    expect(result.fetch).toContain("contentType.includes('application/json')");
    expect(result.fetch).toContain('await response.blob()');
    expect(result.raw).toContain('POST /api?q=1 HTTP/1.1\r\n');
    expect(result.raw).toContain('Host: example.com:8443\r\n');
    expect(result.raw).toContain('Content-Length: 19\r\n');
  });

  it('omits GET and HEAD bodies', () => {
    const result = generateHttpRequest({
      body: 'ignored',
      headers: {},
      method: 'GET',
      url: 'https://example.com',
    });

    expect(result.curl).not.toContain('--data');
    expect(result.fetch).not.toContain('body:');
    expect(result.fetch).toContain('const hasBody = true');
    expect(result.raw).not.toContain('ignored');

    expect(
      generateHttpRequest({
        method: 'HEAD',
        url: 'https://example.com',
      }).fetch,
    ).toContain('const hasBody = false');
  });

  it('parses and validates Headers JSON', () => {
    expect(parseHeadersJson('{"Accept":"application/json"}')).toEqual({
      Accept: 'application/json',
    });
    expect(parseHeadersJson('')).toEqual({});
    expect(() => parseHeadersJson('[]')).toThrow('JSON 对象');
    expect(() => parseHeadersJson('{"X-Test":1}')).toThrow('必须是字符串');
    expect(() => parseHeadersJson('{"Bad Header":"value"}')).toThrow('名称');
    expect(() => parseHeadersJson('{"X-Test":"a\\nb"}')).toThrow('换行');
  });

  it('rejects invalid methods and URLs', () => {
    expect(() =>
      generateHttpRequest({ method: 'P0ST', url: 'https://example.com' }),
    ).toThrow('英文字母');
    expect(() =>
      generateHttpRequest({ method: 'GET', url: 'example.com' }),
    ).toThrow('绝对 URL');
    expect(() =>
      generateHttpRequest({ method: 'GET', url: 'ftp://example.com' }),
    ).toThrow('仅支持');
  });
});
