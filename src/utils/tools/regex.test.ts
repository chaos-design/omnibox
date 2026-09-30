import { describe, expect, it } from 'vitest';

import {
  createRegex,
  MAX_INPUT_LENGTH,
  MAX_PATTERN_LENGTH,
  MAX_REPLACEMENT_LENGTH,
  replaceRegex,
  testRegex,
} from './regex';

describe('regex tools', () => {
  it('returns positions, captures, and named groups', () => {
    const result = testRegex(
      '(?<name>[A-Za-z]+)-(\\d+)',
      'g',
      'item-12 next-7',
    );

    expect(result.matches).toEqual([
      {
        captures: ['item', '12'],
        groups: { name: 'item' },
        index: 0,
        value: 'item-12',
      },
      {
        captures: ['next', '7'],
        groups: { name: 'next' },
        index: 8,
        value: 'next-7',
      },
    ]);
    expect(result.truncated).toBe(false);
  });

  it('respects non-global matching and replacement semantics', () => {
    expect(testRegex('\\d+', '', '1 2').matches).toHaveLength(1);
    expect(replaceRegex('(\\w+)', 'g', 'a b', '[$1]')).toBe('[a] [b]');
  });

  it('advances zero-width global matches and enforces a result limit', () => {
    const result = testRegex('(?=a)', 'g', 'aaaa', 2);

    expect(result.matches.map((match) => match.index)).toEqual([0, 1]);
    expect(result.truncated).toBe(true);
  });

  it('rejects invalid expressions, flags, and limits', () => {
    expect(() => createRegex('[', 'g')).toThrow('正则表达式无效');
    expect(() => createRegex('a', 'gg')).toThrow('flags');
    expect(() => testRegex('a', 'g', 'a', 0)).toThrow('正整数');
  });

  it('rejects oversized patterns, inputs, and replacements', () => {
    expect(() => createRegex('a'.repeat(MAX_PATTERN_LENGTH + 1))).toThrow(
      '长度不能超过',
    );
    expect(() => testRegex('a', 'g', 'a'.repeat(MAX_INPUT_LENGTH + 1))).toThrow(
      '长度不能超过',
    );
    expect(() =>
      replaceRegex('a', 'g', 'a', 'b'.repeat(MAX_REPLACEMENT_LENGTH + 1)),
    ).toThrow('替换模板长度');
  });
});
