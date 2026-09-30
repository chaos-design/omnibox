import { describe, expect, it } from 'vitest';

import { objectToQuery, parseUrl, queryToObject } from './url';

describe('URL tools', () => {
  it('parses URL structure and repeated query parameters', () => {
    expect(
      parseUrl(
        'https://user:pass@example.com:8443/a/b?tag=one&tag=two&q=%E4%BD%A0%E5%A5%BD#top',
      ),
    ).toMatchObject({
      hash: '#top',
      host: 'example.com:8443',
      hostname: 'example.com',
      pathname: '/a/b',
      port: '8443',
      protocol: 'https:',
      query: {
        q: '你好',
        tag: ['one', 'two'],
      },
      username: 'user',
      password: 'pass',
    });
  });

  it('converts query strings to JSON-compatible objects', () => {
    expect(queryToObject('?a=1&a=2&empty=&space=a+b')).toEqual({
      a: ['1', '2'],
      empty: '',
      space: 'a b',
    });
  });

  it('converts scalar and array JSON values to query strings', () => {
    expect(
      objectToQuery({
        tag: ['one', 'two'],
        page: 2,
        active: true,
        empty: null,
      }),
    ).toBe('tag=one&tag=two&page=2&active=true&empty=');
  });

  it('rejects invalid URLs and nested query values', () => {
    expect(() => parseUrl('example.com')).toThrow('协议和主机名');
    expect(() => objectToQuery('[]')).toThrow('JSON 对象');
    expect(() => objectToQuery({ nested: { value: 1 } })).toThrow(
      '只支持字符串',
    );
  });
});
