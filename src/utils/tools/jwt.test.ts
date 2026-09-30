import { describe, expect, it } from 'vitest';

import { encodeBase64Url } from './codec';
import { decodeJwt } from './jwt';

function createToken(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  signature = 'signature',
): string {
  return [
    encodeBase64Url(JSON.stringify(header)),
    encodeBase64Url(JSON.stringify(payload)),
    signature,
  ].join('.');
}

describe('JWT tools', () => {
  it('decodes Unicode JSON and standard claims', () => {
    const token = createToken(
      { alg: 'HS256', typ: 'JWT' },
      {
        exp: 2_000,
        iat: 1_000,
        iss: 'Omnibox',
        name: '工具箱',
      },
    );
    const result = decodeJwt(token, 1_500);

    expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(result.payload.name).toBe('工具箱');
    expect(result.status).toBe('active');
    expect(result.times.exp?.iso).toBe('1970-01-01T00:33:20.000Z');
  });

  it('detects expired and not-yet-valid tokens', () => {
    expect(decodeJwt(createToken({}, { exp: 100 }), 100).status).toBe(
      'expired',
    );
    expect(decodeJwt(createToken({}, { nbf: 200 }), 100).status).toBe(
      'not-yet-valid',
    );
  });

  it('keeps unsigned signature segments without claiming verification', () => {
    expect(decodeJwt(createToken({ alg: 'none' }, {}, '')).signature).toBe('');
    expect(decodeJwt(createToken({}, {})).status).toBe('unknown');
  });

  it('rejects malformed tokens and invalid time claims', () => {
    expect(() => decodeJwt('a.b')).toThrow('三段');
    expect(() => decodeJwt('invalid.invalid.sig')).toThrow('解析失败');
    expect(() => decodeJwt(createToken({}, { exp: 'tomorrow' }))).toThrow(
      '必须是数字',
    );
  });
});
