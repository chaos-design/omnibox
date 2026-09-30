export interface JsonShareTab {
  key: string;
  label: string;
  value: string;
}

export interface JsonSharePayload {
  activeKey: string;
  tabs: JsonShareTab[];
  version: 1;
}

export interface JsonShareStorage {
  getItem: (key: string) => string | null;
}

type CompactJsonShareTab = [label: string, value: string];

interface CompactJsonSharePayload {
  a: number;
  t: CompactJsonShareTab[];
}

type LegacyCompactJsonShareTab = [key: string, label: string, value: string];

interface LegacyCompactJsonSharePayload {
  a: string;
  t: LegacyCompactJsonShareTab[];
  v: 1;
}

type ShareCompressionFormat = 'deflate' | 'deflate-raw';

const compressedSharePrefix = 'v2.';
const legacyCompressedSharePrefix = 'v1.';
const shareParameter = 'data';
const shortCodeAlphabet =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const shortCodeLength = 8;
const shortCodeStoragePrefix = 'OMNIBOX_JSON_SHARE_V1_';
const maxDecompressedShareBytes = 1_000_000;
const maxShareTabCount = 500;

function createSizeLimitedTransform(
  maxBytes: number,
): TransformStream<Uint8Array, Uint8Array> {
  let total = 0;

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      total += chunk.byteLength;

      if (total > maxBytes) {
        controller.error(new Error('分享内容解压后过大，已停止读取。'));
        return;
      }

      controller.enqueue(chunk);
    },
  });
}

function assertShareTabCount(tabs: unknown[]): boolean {
  return tabs.length <= maxShareTabCount;
}

function encodeBytesBase64Url(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

function decodeBase64UrlBytes(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeBase64Url(value: string): string {
  return encodeBytesBase64Url(new TextEncoder().encode(value));
}

function decodeBase64Url(value: string): string {
  return new TextDecoder().decode(decodeBase64UrlBytes(value));
}

function isJsonSharePayload(value: unknown): value is JsonSharePayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const version = Reflect.get(value, 'version');
  const activeKey = Reflect.get(value, 'activeKey');
  const tabs = Reflect.get(value, 'tabs');

  if (
    version !== 1 ||
    typeof activeKey !== 'string' ||
    !Array.isArray(tabs) ||
    tabs.length === 0 ||
    !assertShareTabCount(tabs) ||
    !tabs.every(
      (tab) =>
        typeof tab === 'object' &&
        tab !== null &&
        typeof Reflect.get(tab, 'key') === 'string' &&
        Reflect.get(tab, 'key') !== '' &&
        typeof Reflect.get(tab, 'label') === 'string' &&
        typeof Reflect.get(tab, 'value') === 'string',
    )
  ) {
    return false;
  }

  const tabKeys = tabs.map((tab) => Reflect.get(tab, 'key') as string);

  return (
    new Set(tabKeys).size === tabKeys.length && tabKeys.includes(activeKey)
  );
}

function parseJsonSharePayload(value: string): JsonSharePayload {
  const payload: unknown = JSON.parse(value);

  if (!isJsonSharePayload(payload)) {
    throw new Error('分享数据结构无效。');
  }

  return payload;
}

function serializeCompactPayload(payload: JsonSharePayload): string {
  const compactPayload: CompactJsonSharePayload = {
    a: payload.tabs.findIndex((tab) => tab.key === payload.activeKey),
    t: payload.tabs.map((tab) => [tab.label, tab.value]),
  };

  return JSON.stringify(compactPayload);
}

function parseCompactPayload(value: string): JsonSharePayload {
  const compactPayload: unknown = JSON.parse(value);

  if (typeof compactPayload !== 'object' || compactPayload === null) {
    throw new Error('分享数据结构无效。');
  }

  const activeIndex = Reflect.get(compactPayload, 'a');
  const tabs = Reflect.get(compactPayload, 't');

  if (
    typeof activeIndex !== 'number' ||
    !Number.isInteger(activeIndex) ||
    !Array.isArray(tabs) ||
    !assertShareTabCount(tabs) ||
    activeIndex < 0 ||
    activeIndex >= tabs.length ||
    !tabs.every(
      (tab) =>
        Array.isArray(tab) &&
        tab.length === 2 &&
        tab.every((item) => typeof item === 'string'),
    )
  ) {
    throw new Error('分享数据结构无效。');
  }

  const restoredTabs = tabs.map(([label, tabValue], index) => ({
    key: `shared-tab-${index + 1}`,
    label,
    value: tabValue,
  }));

  return {
    activeKey: restoredTabs[activeIndex].key,
    tabs: restoredTabs,
    version: 1,
  };
}

function serializeLegacyCompactPayload(payload: JsonSharePayload): string {
  const compactPayload: LegacyCompactJsonSharePayload = {
    a: payload.activeKey,
    t: payload.tabs.map((tab) => [tab.key, tab.label, tab.value]),
    v: payload.version,
  };

  return JSON.stringify(compactPayload);
}

function parseLegacyCompactPayload(value: string): JsonSharePayload {
  const compactPayload: unknown = JSON.parse(value);

  if (typeof compactPayload !== 'object' || compactPayload === null) {
    throw new Error('分享数据结构无效。');
  }

  const version = Reflect.get(compactPayload, 'v');
  const activeKey = Reflect.get(compactPayload, 'a');
  const tabs = Reflect.get(compactPayload, 't');

  if (
    version !== 1 ||
    typeof activeKey !== 'string' ||
    !Array.isArray(tabs) ||
    !assertShareTabCount(tabs) ||
    !tabs.every(
      (tab) =>
        Array.isArray(tab) &&
        tab.length === 3 &&
        tab.every((item) => typeof item === 'string'),
    )
  ) {
    throw new Error('分享数据结构无效。');
  }

  return parseJsonSharePayload(
    JSON.stringify({
      activeKey,
      tabs: tabs.map(([key, label, tabValue]) => ({
        key,
        label,
        value: tabValue,
      })),
      version,
    }),
  );
}

async function compress(
  value: string,
  format: ShareCompressionFormat,
): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') {
    throw new Error('当前浏览器不支持生成压缩分享链接。');
  }

  const stream = new Blob([value])
    .stream()
    .pipeThrough(new CompressionStream(format));
  const buffer = await new Response(stream).arrayBuffer();

  return new Uint8Array(buffer);
}

async function decompress(
  value: string,
  format: ShareCompressionFormat,
): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('当前浏览器不支持读取压缩分享链接。');
  }

  const compressed = decodeBase64UrlBytes(value);
  const compressedBuffer = new Uint8Array(compressed.byteLength);
  compressedBuffer.set(compressed);
  const stream = new Blob([compressedBuffer.buffer])
    .stream()
    .pipeThrough(new DecompressionStream(format))
    .pipeThrough(createSizeLimitedTransform(maxDecompressedShareBytes));
  const buffer = await new Response(stream).arrayBuffer();

  return new TextDecoder().decode(buffer);
}

function isShortCode(value: string): boolean {
  return (
    value.length === shortCodeLength &&
    Array.from(value).every((character) =>
      shortCodeAlphabet.includes(character),
    )
  );
}

function getShortCodeStorageKey(shortCode: string): string {
  return `${shortCodeStoragePrefix}${shortCode}`;
}

export function encodeLegacyJsonShareHash(payload: JsonSharePayload): string {
  return new URLSearchParams({
    [shareParameter]: encodeBase64Url(JSON.stringify(payload)),
  }).toString();
}

export async function createJsonShareHash(
  payload: JsonSharePayload,
): Promise<string> {
  if (!isJsonSharePayload(payload)) {
    throw new Error('分享数据结构无效。');
  }

  const compressed = await compress(
    serializeCompactPayload(payload),
    'deflate-raw',
  );

  return `${compressedSharePrefix}${encodeBytesBase64Url(compressed)}`;
}

export async function createLegacyCompressedJsonShareHash(
  payload: JsonSharePayload,
): Promise<string> {
  if (!isJsonSharePayload(payload)) {
    throw new Error('分享数据结构无效。');
  }

  const compressed = await compress(
    serializeLegacyCompactPayload(payload),
    'deflate',
  );

  return `${legacyCompressedSharePrefix}${encodeBytesBase64Url(compressed)}`;
}

export async function decodeJsonShareHash(
  hash: string,
  storage?: JsonShareStorage,
): Promise<JsonSharePayload | null> {
  const hashValue = hash.replace(/^#/u, '');

  if (!hashValue) {
    return null;
  }

  if (hashValue.startsWith(compressedSharePrefix)) {
    try {
      const serialized = await decompress(
        hashValue.slice(compressedSharePrefix.length),
        'deflate-raw',
      );
      return parseCompactPayload(serialized);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`无法读取分享地址：${reason}`, { cause: error });
    }
  }

  if (hashValue.startsWith(legacyCompressedSharePrefix)) {
    try {
      const serialized = await decompress(
        hashValue.slice(legacyCompressedSharePrefix.length),
        'deflate',
      );
      return parseLegacyCompactPayload(serialized);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`无法读取分享地址：${reason}`, { cause: error });
    }
  }

  const encoded = new URLSearchParams(hashValue).get(shareParameter);

  if (encoded) {
    try {
      return parseJsonSharePayload(decodeBase64Url(encoded));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`无法读取分享地址：${reason}`, { cause: error });
    }
  }

  if (!isShortCode(hashValue)) {
    return null;
  }

  try {
    const serialized = storage?.getItem(getShortCodeStorageKey(hashValue));

    if (!serialized) {
      throw new Error('未找到短码内容，8 位短码仅在创建它的浏览器可用。');
    }

    return parseJsonSharePayload(serialized);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`无法读取分享地址：${reason}`, { cause: error });
  }
}
