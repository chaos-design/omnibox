import { decodeBase64Url } from './codec';

export type JwtStatus = 'active' | 'expired' | 'not-yet-valid' | 'unknown';

export interface JwtTimeClaim {
  iso: string;
  value: number;
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  status: JwtStatus;
  times: {
    exp?: JwtTimeClaim;
    iat?: JwtTimeClaim;
    nbf?: JwtTimeClaim;
  };
}

function parseSegment(segment: string, label: string): Record<string, unknown> {
  if (!segment) {
    throw new Error(`JWT ${label} 段不能为空。`);
  }

  let value: unknown;

  try {
    value = JSON.parse(decodeBase64Url(segment));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`JWT ${label} 解析失败：${reason}`);
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`JWT ${label} 必须是 JSON 对象。`);
  }

  return value as Record<string, unknown>;
}

function readTimeClaim(
  payload: Record<string, unknown>,
  name: 'iat' | 'nbf' | 'exp',
): JwtTimeClaim | undefined {
  const value = payload[name];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`JWT ${name} Claim 必须是数字时间戳。`);
  }

  const date = new Date(value * 1000);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`JWT ${name} Claim 超出有效日期范围。`);
  }

  return {
    iso: date.toISOString(),
    value,
  };
}

export function decodeJwt(
  token: string,
  nowSeconds = Date.now() / 1000,
): DecodedJwt {
  const segments = token.trim().split('.');

  if (segments.length !== 3) {
    throw new Error('JWT 必须包含 Header、Payload 和 Signature 三段。');
  }

  const [headerSegment, payloadSegment, signature] = segments;
  const header = parseSegment(headerSegment, 'Header');
  const payload = parseSegment(payloadSegment, 'Payload');
  const times = {
    exp: readTimeClaim(payload, 'exp'),
    iat: readTimeClaim(payload, 'iat'),
    nbf: readTimeClaim(payload, 'nbf'),
  };
  let status: JwtStatus = 'unknown';

  if (times.nbf && nowSeconds < times.nbf.value) {
    status = 'not-yet-valid';
  } else if (times.exp && nowSeconds >= times.exp.value) {
    status = 'expired';
  } else if (times.exp || times.nbf) {
    status = 'active';
  }

  return {
    header,
    payload,
    signature,
    status,
    times,
  };
}
