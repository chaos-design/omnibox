export type UnicodeNormalization = 'NFC' | 'NFD' | 'NFKC' | 'NFKD';

export interface UnicodeCharacterInfo {
  category: string;
  character: string;
  codePoint: string;
  htmlEntity: string;
  index: number;
  utf16: string;
  utf8: string;
}

export interface UnicodeEscapes {
  codePoint: string;
  html: string;
  utf16: string;
}

function toHex(value: number, length = 2): string {
  return value.toString(16).toUpperCase().padStart(length, '0');
}

function getCategory(character: string): string {
  if (/\p{Cc}/u.test(character)) {
    return '控制字符';
  }

  if (/\s/u.test(character)) {
    return '空白';
  }

  if (/\p{L}/u.test(character)) {
    return '字母';
  }

  if (/\p{N}/u.test(character)) {
    return '数字';
  }

  if (/\p{M}/u.test(character)) {
    return '组合标记';
  }

  if (/\p{P}/u.test(character)) {
    return '标点';
  }

  if (/\p{S}/u.test(character)) {
    return '符号';
  }

  return '其他';
}

function getUtf16Escapes(character: string): string {
  return Array.from(
    { length: character.length },
    (_, index) => `\\u${toHex(character.charCodeAt(index), 4)}`,
  ).join('');
}

export function countUnicodeCodePoints(input: string): number {
  let count = 0;

  for (const _character of input) {
    count += 1;
  }

  return count;
}

export function inspectUnicode(
  input: string,
  limit = Number.POSITIVE_INFINITY,
): UnicodeCharacterInfo[] {
  const result: UnicodeCharacterInfo[] = [];
  let offset = 0;

  for (const character of input) {
    if (result.length >= limit) {
      break;
    }

    const codePoint = character.codePointAt(0) ?? 0;
    const item: UnicodeCharacterInfo = {
      category: getCategory(character),
      character,
      codePoint: `U+${toHex(codePoint, 4)}`,
      htmlEntity: `&#x${toHex(codePoint)};`,
      index: offset,
      utf16: getUtf16Escapes(character),
      utf8: Array.from(new TextEncoder().encode(character), (byte) =>
        toHex(byte),
      ).join(' '),
    };

    offset += character.length;
    result.push(item);
  }

  return result;
}

export function encodeUnicodeEscapes(input: string): UnicodeEscapes {
  return {
    codePoint: Array.from(input, (character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return `\\u{${toHex(codePoint)}}`;
    }).join(''),
    html: Array.from(input, (character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return `&#x${toHex(codePoint)};`;
    }).join(''),
    utf16: Array.from(input, getUtf16Escapes).join(''),
  };
}

function parseCodePoint(source: string): string {
  if (!/^[\dA-Fa-f]{1,6}$/u.test(source)) {
    throw new Error('Unicode code point 转义格式无效。');
  }

  const value = Number.parseInt(source, 16);

  if (value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
    throw new Error('Unicode code point 超出有效标量范围。');
  }

  return String.fromCodePoint(value);
}

export function decodeUnicodeEscapes(input: string): string {
  let output = '';

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] !== '\\' || input[index + 1] !== 'u') {
      output += input[index];
      continue;
    }

    if (input[index + 2] === '{') {
      const end = input.indexOf('}', index + 3);

      if (end === -1) {
        throw new Error('Unicode code point 转义缺少右花括号。');
      }

      output += parseCodePoint(input.slice(index + 3, end));
      index = end;
      continue;
    }

    const source = input.slice(index + 2, index + 6);

    if (!/^[\dA-Fa-f]{4}$/u.test(source)) {
      throw new Error('UTF-16 转义必须包含 4 个十六进制字符。');
    }

    const first = Number.parseInt(source, 16);

    if (first >= 0xd800 && first <= 0xdbff) {
      const nextPrefix = input.slice(index + 6, index + 8);
      const nextSource = input.slice(index + 8, index + 12);

      if (nextPrefix !== '\\u' || !/^[\dA-Fa-f]{4}$/u.test(nextSource)) {
        throw new Error('高位代理项后必须跟随低位代理项。');
      }

      const second = Number.parseInt(nextSource, 16);

      if (second < 0xdc00 || second > 0xdfff) {
        throw new Error('高位代理项后必须跟随低位代理项。');
      }

      output += String.fromCharCode(first, second);
      index += 11;
      continue;
    }

    if (first >= 0xdc00 && first <= 0xdfff) {
      throw new Error('低位代理项缺少对应的高位代理项。');
    }

    output += String.fromCharCode(first);
    index += 5;
  }

  return output;
}

export function normalizeUnicode(
  input: string,
  form: UnicodeNormalization,
): string {
  return input.normalize(form);
}
