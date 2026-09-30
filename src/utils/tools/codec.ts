const base64Pattern = /^[A-Za-z\d+/]*={0,2}$/;
const htmlEntityMap: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: '\u00a0',
  quot: '"',
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function normalizeBase64(input: string): string {
  const source = input.replace(/\s+/gu, '');

  if (
    !base64Pattern.test(source) ||
    source.length % 4 === 1 ||
    /=/u.test(source.slice(0, -2))
  ) {
    throw new Error('请输入有效的 Base64 内容。');
  }

  return source.padEnd(Math.ceil(source.length / 4) * 4, '=');
}

function base64ToText(input: string): string {
  try {
    const binary = atob(normalizeBase64(input));
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );

    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Base64')) {
      throw error;
    }

    throw new Error('Base64 内容不是有效的 UTF-8 文本。');
  }
}

export function encodeBase64(input: string): string {
  return bytesToBase64(new TextEncoder().encode(input));
}

export function decodeBase64(input: string): string {
  return base64ToText(input);
}

export function encodeBase64Url(input: string): string {
  return encodeBase64(input)
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/=+$/u, '');
}

export function decodeBase64Url(input: string): string {
  const source = input.trim();

  if (!/^[A-Za-z\d_-]*={0,2}$/u.test(source)) {
    throw new Error('请输入有效的 Base64URL 内容。');
  }

  return base64ToText(source.replace(/-/gu, '+').replace(/_/gu, '/'));
}

export function encodeUrl(input: string, component = true): string {
  return component ? encodeURIComponent(input) : encodeURI(input);
}

export function decodeUrl(input: string, component = true): string {
  try {
    return component ? decodeURIComponent(input) : decodeURI(input);
  } catch {
    throw new Error('URL 编码内容不完整或格式无效。');
  }
}

export function encodeHtmlEntities(input: string): string {
  return input.replace(/[&<>"']/gu, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };

    return entities[character];
  });
}

export function decodeHtmlEntities(input: string): string {
  return input.replace(
    /&(?:#(\d+)|#x([\dA-Fa-f]+)|([A-Za-z]+));/gu,
    (entity, decimal: string, hexadecimal: string, name: string) => {
      const code = decimal
        ? Number.parseInt(decimal, 10)
        : hexadecimal
          ? Number.parseInt(hexadecimal, 16)
          : null;

      if (code !== null) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return entity;
        }
      }

      return htmlEntityMap[name.toLowerCase()] ?? entity;
    },
  );
}
