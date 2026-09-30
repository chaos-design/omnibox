import { describe, expect, it } from 'vitest';

import {
  mutateJsonPointer,
  parseJsonPointer,
  resolveJsonPointer,
} from './json-pointer';

const source = JSON.stringify({
  items: [{ name: 'first' }, { name: 'second' }],
  'a/b': { '~key': true },
});

describe('JSON Pointer tools', () => {
  it('parses RFC 6901 escape sequences', () => {
    expect(parseJsonPointer('/a~1b/~0key')).toEqual(['a/b', '~key']);
    expect(resolveJsonPointer(source, '/a~1b/~0key')).toBe(true);
  });

  it('resolves the root and array values', () => {
    expect(resolveJsonPointer(source, '')).toEqual(JSON.parse(source));
    expect(resolveJsonPointer(source, '/items/1/name')).toBe('second');
  });

  it('adds, replaces, and removes values immutably', () => {
    expect(
      JSON.parse(
        mutateJsonPointer(source, '/items/-', 'add', { name: 'third' }),
      ).items,
    ).toHaveLength(3);
    expect(
      resolveJsonPointer(
        mutateJsonPointer(source, '/items/0/name', 'replace', 'updated'),
        '/items/0/name',
      ),
    ).toBe('updated');
    expect(
      JSON.parse(mutateJsonPointer(source, '/items/0', 'remove')).items,
    ).toEqual([{ name: 'second' }]);
    expect(JSON.parse(source).items[0].name).toBe('first');
  });

  it('supports root replacement and removal', () => {
    expect(mutateJsonPointer(source, '', 'replace', ['root'])).toBe(
      '[\n  "root"\n]',
    );
    expect(mutateJsonPointer(source, '', 'remove')).toBe('null');
  });

  it('creates __proto__ as a JSON property without changing the prototype', () => {
    const result = JSON.parse(
      mutateJsonPointer('{"object":{}}', '/object/__proto__', 'add', {
        safe: true,
      }),
    ) as { object: Record<string, unknown> };

    expect(Object.hasOwn(result.object, '__proto__')).toBe(true);
    expect(result.object.__proto__).toEqual({ safe: true });
    expect(Object.getPrototypeOf(result.object)).toBe(Object.prototype);
  });

  it('rejects invalid escapes, indexes, and missing paths', () => {
    expect(() => parseJsonPointer('items/0')).toThrow('以 / 开头');
    expect(() => parseJsonPointer('/a~2b')).toThrow('~0 和 ~1');
    expect(() => resolveJsonPointer(source, '/items/01')).toThrow('索引');
    expect(() => resolveJsonPointer(source, '/missing')).toThrow('不存在');
    expect(() => mutateJsonPointer(source, '/items/-', 'replace', 1)).toThrow(
      '索引',
    );
  });
});
