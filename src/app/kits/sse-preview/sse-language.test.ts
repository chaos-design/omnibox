import { describe, expect, it } from 'vitest';

import { parseSseStream } from '../../../utils/tools/sse';

import { tokenizeSseLine } from './sse-language';

describe('SSE Monaco tokenizer', () => {
  it('marks the four standard fields as keywords', () => {
    for (const field of ['event', 'data', 'id', 'retry']) {
      expect(tokenizeSseLine(`${field}: x`).field).toBe('keyword');
    }
  });

  it('treats a comment line as a comment even without a space', () => {
    expect(tokenizeSseLine(':').field).toBe('comment');
    expect(tokenizeSseLine(': ping').field).toBe('comment');
  });

  it('marks unknown and non-standard field names as invalid', () => {
    expect(tokenizeSseLine('foo: bar').field).toBe('invalid');
    expect(tokenizeSseLine('x-custom').field).toBe('invalid');
  });

  it('keeps the delimiter and value as separate tokens', () => {
    expect(tokenizeSseLine('data: {"a":1}').tokens).toEqual([
      { kind: 'keyword', value: 'data' },
      { kind: 'delimiter', value: ':' },
      { kind: 'string', value: ' {"a":1}' },
    ]);
  });

  it('handles a field with an empty value and a bare field name', () => {
    expect(tokenizeSseLine('data:').tokens).toEqual([
      { kind: 'keyword', value: 'data' },
      { kind: 'delimiter', value: ':' },
    ]);
    expect(tokenizeSseLine('data').field).toBe('keyword');
  });

  it('produces no tokens for blank lines', () => {
    expect(tokenizeSseLine('').tokens).toEqual([]);
    expect(tokenizeSseLine('   ').tokens).toEqual([]);
  });

  it('agrees with the parser on which fields are known', () => {
    const result = parseSseStream('data: a\n\nfoo: b\n\n');

    expect(
      result.lines
        .filter((line) => line.kind === 'field')
        .map((line) => tokenizeSseLine(line.raw).field),
    ).toEqual(['keyword', 'invalid']);
  });
});
