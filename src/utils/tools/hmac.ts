export type HmacAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';
export type HmacKeyEncoding = 'text' | 'hex';
export type HmacOutput = 'hex' | 'base64';

interface HmacOptions {
  algorithm?: HmacAlgorithm;
  keyEncoding?: HmacKeyEncoding;
  output?: HmacOutput;
}

function getCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error('当前浏览器不支持 Web Crypto HMAC。');
  }

  return globalThis.crypto;
}

function parseKey(key: string, encoding: HmacKeyEncoding): Uint8Array {
  if (!key) {
    throw new Error('HMAC 密钥不能为空。');
  }

  if (encoding === 'text') {
    return new TextEncoder().encode(key);
  }

  const source = key.trim();

  if (!source || source.length % 2 !== 0 || !/^[\dA-Fa-f]+$/u.test(source)) {
    throw new Error('十六进制密钥必须由偶数个 0-9、A-F 字符组成。');
  }

  return Uint8Array.from(source.match(/.{2}/gu) ?? [], (value) =>
    Number.parseInt(value, 16),
  );
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

export async function generateHmac(
  message: string,
  key: string,
  options: HmacOptions = {},
): Promise<string> {
  const {
    algorithm = 'SHA-256',
    keyEncoding = 'text',
    output = 'hex',
  } = options;
  const cryptoApi = getCrypto();
  const keyBuffer = new Uint8Array(parseKey(key, keyEncoding)).buffer;
  const messageBuffer = new Uint8Array(new TextEncoder().encode(message))
    .buffer;
  const cryptoKey = await cryptoApi.subtle.importKey(
    'raw',
    keyBuffer,
    { hash: algorithm, name: 'HMAC' },
    false,
    ['sign'],
  );
  const signature = await cryptoApi.subtle.sign(
    'HMAC',
    cryptoKey,
    messageBuffer,
  );
  const bytes = new Uint8Array(signature);

  return output === 'hex' ? bytesToHex(bytes) : bytesToBase64(bytes);
}
