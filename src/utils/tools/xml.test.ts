// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { formatXml, minifyXml, parseXml, queryXml } from './xml';

const source =
  '<root><item id="1">Alpha</item><item id="2"><name>Beta</name></item></root>';

describe('XML tools', () => {
  it('formats and minifies element-only XML without changing text content', () => {
    const formatted = formatXml(source);

    expect(formatted).toContain('\n  <item id="1">Alpha</item>');
    expect(formatted).toContain('\n    <name>Beta</name>');
    expect(minifyXml(formatted)).toBe(source);
  });

  it('preserves mixed content without injecting whitespace', () => {
    const mixed = '<p>Hello <b>world</b>!</p>';
    const inlineSpacing = '<p><b>Hello</b> <i>world</i></p>';

    expect(formatXml(mixed)).toBe(mixed);
    expect(formatXml(inlineSpacing)).toBe(inlineSpacing);
    expect(minifyXml(inlineSpacing)).toBe(inlineSpacing);
  });

  it('queries nodes and scalar XPath results', () => {
    expect(queryXml(source, '//item/@id').values).toEqual(['1', '2']);
    expect(queryXml(source, 'count(//item)')).toMatchObject({
      type: 'number',
      values: ['2'],
    });
    expect(queryXml(source, 'string(//item[1])').values).toEqual(['Alpha']);
  });

  it('limits node results', () => {
    expect(queryXml(source, '//item', 1)).toMatchObject({
      truncated: true,
      type: 'nodes',
    });
  });

  it('rejects invalid, unsafe, and malformed XPath input', () => {
    expect(parseXml('<parsererror/>').documentElement.localName).toBe(
      'parsererror',
    );
    expect(
      parseXml('<parsererror xmlns="urn:example"/>').documentElement
        .namespaceURI,
    ).toBe('urn:example');
    expect(() => parseXml('<root>')).toThrow('XML 格式无效');
    expect(() => parseXml('<!DOCTYPE root><root/>')).toThrow('DOCTYPE');
    expect(() => queryXml(source, '//*[')).toThrow('XPath 表达式无效');
    expect(() => queryXml(source, '')).toThrow('请输入 XPath');
  });
});
