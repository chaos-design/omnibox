export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

function getCrypto(): Crypto {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('当前浏览器不支持安全随机数生成。');
  }

  return globalThis.crypto;
}

export async function hashText(
  input: string,
  algorithm: HashAlgorithm,
): Promise<string> {
  const cryptoApi = getCrypto();

  if (!cryptoApi.subtle) {
    throw new Error('当前浏览器不支持 Web Crypto 哈希计算。');
  }

  const digest = await cryptoApi.subtle.digest(
    algorithm,
    new TextEncoder().encode(input),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export function generateUuid(): string {
  const cryptoApi = getCrypto();

  if (typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const value = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');

  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20),
  ].join('-');
}

export function generateRandomString(length: number, alphabet: string): string {
  if (!Number.isInteger(length) || length < 1 || length > 4096) {
    throw new Error('随机字符串长度必须是 1 到 4096 之间的整数。');
  }

  const characters = Array.from(alphabet);

  if (
    characters.length < 2 ||
    characters.length > 256 ||
    new Set(characters).size !== characters.length
  ) {
    throw new Error('字符集需包含 2 到 256 个不重复字符。');
  }

  const cryptoApi = getCrypto();
  const upperBound = 256 - (256 % characters.length);
  const result: string[] = [];

  while (result.length < length) {
    const remaining = length - result.length;
    const bytes = cryptoApi.getRandomValues(
      new Uint8Array(Math.min(Math.max(remaining * 2, 32), 65_536)),
    );

    for (const byte of bytes) {
      if (byte >= upperBound) {
        continue;
      }

      result.push(characters[byte % characters.length]);

      if (result.length === length) {
        break;
      }
    }
  }

  return result.join('');
}
