import { describe, expect, it } from 'vitest';

import { csvToJson, jsonToCsv } from './csv';

describe('CSV tools', () => {
  it('parses BOM, escaped quotes, delimiters, and quoted newlines', () => {
    const source =
      '\uFEFFname,note\n"Omnibox","hello, ""world"""\n工具箱,"line 1\nline 2"';

    expect(JSON.parse(csvToJson(source))).toEqual([
      { name: 'Omnibox', note: 'hello, "world"' },
      { name: '工具箱', note: 'line 1\nline 2' },
    ]);
  });

  it('supports semicolon delimiters and headerless rows', () => {
    expect(
      JSON.parse(csvToJson('a;b\n1;2', { delimiter: ';', header: false })),
    ).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('preserves a final row containing one quoted empty field', () => {
    expect(JSON.parse(csvToJson('""', { header: false }))).toEqual([['']]);
    expect(JSON.parse(csvToJson('value\n""'))).toEqual([{ value: '' }]);
  });

  it('rejects invalid headers, row widths, and unclosed quotes', () => {
    expect(() => csvToJson('name,name\n1,2')).toThrow('不能重复');
    expect(() => csvToJson('name,\n1,2')).toThrow('不能为空');
    expect(() => csvToJson('a,b\n1')).toThrow('预期 2 列');
    expect(() => csvToJson('a\n"b')).toThrow('未闭合');
    expect(() => csvToJson('a\n"b"x')).toThrow('非法字符');
  });

  it('converts flat objects and matrices to escaped CSV', () => {
    expect(
      jsonToCsv(
        JSON.stringify([
          { name: 'A,B', note: '"quoted"' },
          { name: '工具箱', active: true },
        ]),
      ),
    ).toBe('name,note,active\n"A,B","""quoted""",\n工具箱,,true');
    expect(jsonToCsv('[[1,"a"],[2,"b"]]', { delimiter: '\t' })).toBe(
      '1\ta\n2\tb',
    );
  });

  it('rejects non-array and nested JSON structures', () => {
    expect(() => jsonToCsv('{"a":1}')).toThrow('顶层必须是数组');
    expect(() => jsonToCsv('[{"a":{"b":1}}]')).toThrow('嵌套对象');
  });
});
