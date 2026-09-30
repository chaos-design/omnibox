import { describe, expect, it } from 'vitest';

import {
  collapseWhitespace,
  convertTextCase,
  getTextStatistics,
  transformLines,
  trimLines,
  trimText,
} from './text';

describe('text tools', () => {
  it('converts mixed identifiers into common naming styles', () => {
    const source = 'helloWorld HTTP server';

    expect(convertTextCase(source, 'camel')).toBe('helloWorldHttpServer');
    expect(convertTextCase(source, 'pascal')).toBe('HelloWorldHttpServer');
    expect(convertTextCase(source, 'snake')).toBe('hello_world_http_server');
    expect(convertTextCase(source, 'kebab')).toBe('hello-world-http-server');
    expect(convertTextCase(source, 'constant')).toBe('HELLO_WORLD_HTTP_SERVER');
  });

  it('cleans whole text and line whitespace independently', () => {
    expect(trimText('  a \n')).toBe('a');
    expect(collapseWhitespace('  a \n\t b  ')).toBe('a b');
    expect(trimLines(' a  \n  b ')).toBe('a\nb');
  });

  it('sorts, deduplicates, and reverses lines', () => {
    expect(transformLines('item10\nitem2', 'sort-asc')).toBe('item2\nitem10');
    expect(transformLines('b\na\nb', 'deduplicate')).toBe('b\na');
    expect(transformLines('a\nb\nc', 'reverse')).toBe('c\nb\na');
  });

  it('counts Unicode code points, words, lines, and UTF-8 bytes', () => {
    expect(getTextStatistics('Hi 你好\n🚀')).toEqual({
      characters: 7,
      charactersWithoutWhitespace: 5,
      words: 2,
      lines: 2,
      bytes: 14,
    });
    expect(getTextStatistics('')).toEqual({
      characters: 0,
      charactersWithoutWhitespace: 0,
      words: 0,
      lines: 0,
      bytes: 0,
    });
  });
});
