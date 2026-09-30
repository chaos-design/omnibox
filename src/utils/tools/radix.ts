export type Radix = 2 | 8 | 10 | 16;

export interface RadixResult {
  binary: string;
  decimal: string;
  hexadecimal: string;
  octal: string;
}

const prefixes: Partial<Record<Radix, string>> = {
  2: '0b',
  8: '0o',
  16: '0x',
};

function parseRadix(input: string, radix: Radix): bigint {
  let source = input.trim();

  if (!source) {
    throw new Error('请输入需要转换的整数。');
  }

  let sign = 1n;

  if (source.startsWith('-') || source.startsWith('+')) {
    sign = source.startsWith('-') ? -1n : 1n;
    source = source.slice(1);
  }

  const detectedPrefix = (
    [
      [2, '0b'],
      [8, '0o'],
      [16, '0x'],
    ] as const
  ).find(([, prefix]) => source.toLowerCase().startsWith(prefix));

  if (detectedPrefix) {
    if (detectedPrefix[0] !== radix) {
      throw new Error(`输入前缀与所选的 ${radix} 进制不一致。`);
    }

    source = source.slice(2);
  }

  if (!source || source.includes('.')) {
    throw new Error('进制转换仅支持整数。');
  }

  const patterns: Record<Radix, RegExp> = {
    2: /^[01]+$/u,
    8: /^[0-7]+$/u,
    10: /^\d+$/u,
    16: /^[\dA-Fa-f]+$/u,
  };

  if (!patterns[radix].test(source)) {
    throw new Error(`输入包含不属于 ${radix} 进制的字符。`);
  }

  const prefix = prefixes[radix] ?? '';
  return sign * BigInt(`${prefix}${source}`);
}

export function convertRadix(input: string, radix: Radix): RadixResult {
  const value = parseRadix(input, radix);

  return {
    binary: value.toString(2),
    octal: value.toString(8),
    decimal: value.toString(10),
    hexadecimal: value.toString(16).toUpperCase(),
  };
}
