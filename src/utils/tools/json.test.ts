import { describe, expect, it } from 'vitest';

import {
  chinesePunctuationToEnglish,
  chineseToUnicode,
  compileJSON,
  compressAndEscapeJSON,
  compressJSON,
  escapeJSON,
  formatJSON,
  getJSONStatistics,
  json2Schema,
  parseJSON,
  sortJSONKeys,
  unescapeJSON,
  unicodeToChinese,
} from './json';

describe('JSON tools', () => {
  it('parses JSON5 object syntax without executing code', () => {
    expect(parseJSON("{name: 'Omnibox', enabled: true,}")).toEqual({
      name: 'Omnibox',
      enabled: true,
    });
  });

  it('formats and compresses structured input without changing string spaces', () => {
    const source = '{"message":"hello world","items":[1,2]}';

    expect(formatJSON(source)).toContain('\n  "message": "hello world"');
    expect(compressJSON(source)).toBe(source);
  });

  it('escapes and unescapes control characters', () => {
    const source = 'line 1\n"line 2"';
    const escaped = escapeJSON(source);

    expect(escaped).toBe('line 1\\n\\"line 2\\"');
    expect(unescapeJSON(escaped)).toBe(source);
    expect(compressAndEscapeJSON('{"a": 1}')).toBe('{\\"a\\":1}');
  });

  it('converts unicode and Chinese punctuation predictably', () => {
    expect(chineseToUnicode('Hello，世界')).toBe('Hello\\uFF0C\\u4E16\\u754C');
    expect(unicodeToChinese('\\u4F60\\u597D')).toBe('你好');
    expect(chinesePunctuationToEnglish('“你好”，世界！')).toBe('"你好",世界!');
  });

  it('sorts object keys recursively without reordering arrays', () => {
    expect(
      sortJSONKeys('{"z":1,"a":{"d":2,"b":1},"list":[{"y":2,"x":1},0]}'),
    ).toBe(`{
  "a": {
    "b": 1,
    "d": 2
  },
  "list": [
    {
      "x": 1,
      "y": 2
    },
    0
  ],
  "z": 1
}`);
  });

  it('counts JSON structure depth, values, and UTF-8 bytes', () => {
    const source = '{"name":"工具","items":[1,{"active":true}]}';

    expect(getJSONStatistics(source)).toEqual({
      arrays: 1,
      bytes: new TextEncoder().encode(source).length,
      keys: 3,
      maxDepth: 4,
      objects: 2,
      values: 3,
    });
  });

  it('generates nested TypeScript declarations in the browser', async () => {
    const result = await compileJSON(
      {
        name: 'Omnibox',
        profile: { active: true },
        tags: ['tools'],
      },
      { name: 'RootInterface' },
    );

    expect(result).toContain('export interface RootInterface');
    expect(result).toContain('profile: RootInterfaceProfile;');
    expect(result).toContain('tags: string[];');
    expect(result).toContain('export interface RootInterfaceProfile');
  });

  it('generates a valid TypeScript name when the root name starts with a digit', async () => {
    const result = await compileJSON({ value: 1 }, { name: '123 root' });

    expect(result).toContain('export interface Generated123Root');
    expect(result).not.toContain('interface 123Root');
  });

  it('preserves __proto__/constructor keys in generated schema without crashing', async () => {
    const schema = (await json2Schema({
      safe: 1,
      constructor: 'x',
      __proto__: { nested: true },
    })) as { properties: Record<string, unknown> };

    expect(schema.properties).toEqual({
      safe: expect.any(Object),
      constructor: expect.any(Object),
      __proto__: expect.any(Object),
    });
  });

  it('rejects JSON nested deeper than the supported depth', () => {
    const deepSource = `[${'['.repeat(600)}${']'.repeat(600)}]`;

    expect(() => getJSONStatistics(deepSource)).toThrow('嵌套层级');
    expect(() => sortJSONKeys(deepSource)).toThrow('嵌套层级');
  });
});
