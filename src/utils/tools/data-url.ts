export interface ParsedDataUrl {
  base64: boolean;
  bytes: Uint8Array;
  charset?: string;
  mediaType: string;
  size: number;
}

function assertMediaType(mediaType: string): void {
  if (!/^[\w!#$&^.+-]+\/[\w!#$&^.+-]+$/u.test(mediaType)) {
    throw new Error('MIME type 格式无效。');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function base64ToBytes(input: string): Uint8Array {
  const source = input.replace(/\s+/gu, '');

  if (!/^[A-Za-z\d+/]*={0,2}$/u.test(source) || source.length % 4 === 1) {
    throw new Error('Data URL 包含无效的 Base64 数据。');
  }

  try {
    return Uint8Array.from(atob(source), (character) =>
      character.charCodeAt(0),
    );
  } catch {
    throw new Error('Data URL 包含无效的 Base64 数据。');
  }
}

function percentPayloadToBytes(payload: string): Uint8Array {
  const bytes: number[] = [];

  for (let index = 0; index < payload.length; index += 1) {
    if (payload[index] === '%') {
      const hexadecimal = payload.slice(index + 1, index + 3);

      if (!/^[\dA-Fa-f]{2}$/u.test(hexadecimal)) {
        throw new Error('Data URL 包含不完整的百分号编码。');
      }

      bytes.push(Number.parseInt(hexadecimal, 16));
      index += 2;
      continue;
    }

    const codePoint = payload.codePointAt(index);
    const character =
      codePoint === undefined
        ? payload[index]
        : String.fromCodePoint(codePoint);
    bytes.push(...new TextEncoder().encode(character));
    index += character.length - 1;
  }

  return Uint8Array.from(bytes);
}

export function encodeTextDataUrl(
  text: string,
  mediaType = 'text/plain',
  base64 = false,
  charset = 'UTF-8',
): string {
  assertMediaType(mediaType);

  if (!/^[\w-]+$/u.test(charset)) {
    throw new Error('charset 格式无效。');
  }

  const prefix = `data:${mediaType};charset=${charset}`;

  return base64
    ? `${prefix};base64,${bytesToBase64(new TextEncoder().encode(text))}`
    : `${prefix},${encodeURIComponent(text)}`;
}

export function encodeBytesDataUrl(
  bytes: Uint8Array,
  mediaType = 'application/octet-stream',
): string {
  assertMediaType(mediaType);
  return `data:${mediaType};base64,${bytesToBase64(bytes)}`;
}

export function parseDataUrl(input: string): ParsedDataUrl {
  const source = input.trim();

  if (!source.startsWith('data:')) {
    throw new Error('Data URL 必须以 data: 开头。');
  }

  const commaIndex = source.indexOf(',');

  if (commaIndex === -1) {
    throw new Error('Data URL 缺少元数据与内容之间的逗号。');
  }

  const metadata = source.slice(5, commaIndex);
  const payload = source.slice(commaIndex + 1);
  const segments = metadata.split(';');
  const mediaType = segments[0] || 'text/plain';
  assertMediaType(mediaType);
  const base64 = segments.some((segment) => segment.toLowerCase() === 'base64');
  const charset = segments
    .find((segment) => /^charset=/iu.test(segment))
    ?.slice('charset='.length);
  const bytes = base64
    ? base64ToBytes(payload)
    : percentPayloadToBytes(payload);

  return {
    base64,
    bytes,
    charset,
    mediaType,
    size: bytes.length,
  };
}

export function decodeDataUrlText(input: string): string {
  const result = parseDataUrl(input);

  try {
    return new TextDecoder(result.charset ?? 'utf-8', { fatal: true }).decode(
      result.bytes,
    );
  } catch {
    throw new Error(
      `Data URL 内容无法按 ${result.charset ?? 'UTF-8'} 解码为文本。`,
    );
  }
}

export function dataUrlToBlob(input: string): Blob {
  const result = parseDataUrl(input);
  return new Blob([new Uint8Array(result.bytes)], { type: result.mediaType });
}
