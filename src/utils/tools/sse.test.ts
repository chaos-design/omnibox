import { describe, expect, it } from 'vitest';

import { buildSseClientCode, parseSseStream, ssePresets } from './sse';

describe('SSE incremental reveal', () => {
  const stream = 'event: a\ndata: 1\n\ndata: 2\n\n';

  it('reports the full body length when nothing is truncated', () => {
    expect(parseSseStream(stream).totalLines).toBe(5);
  });

  it('withholds the dispatch until the terminating blank line arrives', () => {
    const beforeBlank = parseSseStream(stream, { revealLines: 2 });

    expect(beforeBlank.truncated).toBe(true);
    expect(beforeBlank.dispatched).toHaveLength(0);
    expect(beforeBlank.frames[0].streaming).toBe(true);
    expect(beforeBlank.frames[0].reason).toContain('接收中');

    const afterBlank = parseSseStream(stream, { revealLines: 3 });

    expect(afterBlank.dispatched).toHaveLength(1);
    expect(afterBlank.dispatched[0].data).toBe('1');
  });

  it('does not raise the truncation error while streaming is in progress', () => {
    const partial = parseSseStream(stream, { revealLines: 2 });

    expect(partial.diagnostics.some((item) => item.level === 'error')).toBe(
      false,
    );
    expect(
      parseSseStream(stream).diagnostics.some((item) => item.level === 'error'),
    ).toBe(false);
  });

  it('reveals events progressively as more lines arrive', () => {
    // event: a / data: 1 / 空行 / data: 2 / 空行 —— 派发只发生在空行到达时。
    const counts = [0, 1, 2, 3, 4, 5].map(
      (revealLines) =>
        parseSseStream(stream, { revealLines }).dispatched.length,
    );

    expect(counts).toEqual([0, 0, 0, 1, 1, 2]);
  });

  it('holds an event in the streaming state until its blank line lands', () => {
    const states = [1, 2, 3].map((revealLines) => {
      const frame = parseSseStream(stream, { revealLines }).frames[0];
      return frame.streaming
        ? 'streaming'
        : frame.dispatched
          ? 'sent'
          : 'other';
    });

    expect(states).toEqual(['streaming', 'streaming', 'sent']);
  });

  it('keeps a partially received payload visible while streaming', () => {
    const partial = 'event: a\ndata: {"part":\n\n';
    const frame = parseSseStream(partial, { revealLines: 2 }).frames[0];

    expect(frame.streaming).toBe(true);
    expect(frame.dispatched).toBe(false);
    expect(frame.data).toBe('{"part":');
  });

  it('clamps revealLines beyond the body length', () => {
    const result = parseSseStream(stream, { revealLines: 999 });

    expect(result.truncated).toBe(false);
    expect(result.dispatched).toHaveLength(2);
  });

  it('clamps a reveal budget larger than the stream', () => {
    const result = parseSseStream('data: a\n\n', { revealLines: 6 });

    expect(result.totalLines).toBe(2);
    expect(result.truncated).toBe(false);
    expect(result.dispatched).toHaveLength(1);
  });

  it('exposes frame end lines so playback can step one event at a time', () => {
    const full = parseSseStream(stream);
    const steps = full.frames.map((frame) => frame.endLine);

    // 帧的 endLine 含结尾空行，播放跳到该行时事件恰好完成派发。
    expect(steps).toEqual([3, 5]);
    expect(
      steps.map(
        (step) =>
          parseSseStream(stream, { revealLines: step }).dispatched.length,
      ),
    ).toEqual([1, 2]);
  });
});

describe('SSE stream parser', () => {
  it('parses the standard event/id/data frame layout', () => {
    const result = parseSseStream(
      'retry: 3000\n\nid: 1\nevent: open\ndata: {"a":1}\n\n',
    );

    expect(result.reconnectionTime).toBe(3000);
    expect(result.dispatched).toHaveLength(1);
    expect(result.dispatched[0]).toMatchObject({
      type: 'open',
      data: '{"a":1}',
      id: '1',
      lastEventId: '1',
      dispatched: true,
    });
    expect(result.dispatched[0].payload.isJson).toBe(true);
    expect(result.lastEventId).toBe('1');
  });

  it('defaults the event type to message and joins multi-line data', () => {
    const result = parseSseStream('data: first\ndata: second\n\n');

    expect(result.dispatched[0].type).toBe('message');
    expect(result.dispatched[0].data).toBe('first\nsecond');
    expect(result.dispatched[0].dataLines).toBe(2);
  });

  it('treats comment lines and unknown fields as ignored', () => {
    const result = parseSseStream(': ping\nfoo: bar\ndata: ok\n\n');

    expect(result.comments).toBe(1);
    expect(result.dispatched[0].data).toBe('ok');
    expect(
      result.diagnostics.some((item) => item.message.includes('未知字段')),
    ).toBe(true);
  });

  it('never dispatches frames without a data field', () => {
    const result = parseSseStream('event: no-data\nid: 9\n\n');

    expect(result.dispatched).toHaveLength(0);
    expect(result.frames[0].reason).toContain('没有 data 字段');
    expect(result.frames[0].silent).toBe(false);
    expect(result.lastEventId).toBe('9');
  });

  it('keeps the normal presets free of protocol errors', () => {
    // tricky 示例刻意演示被截断的流，不适用零错误断言。
    for (const preset of ssePresets.filter((item) => item.id !== 'tricky')) {
      const result = parseSseStream(preset.value);
      const errors = result.diagnostics.filter(
        (item) => item.level === 'error',
      );

      expect({ id: preset.id, errors }).toEqual({ id: preset.id, errors: [] });
    }
  });

  it('demonstrates a truncated stream in the tricky preset', () => {
    const result = parseSseStream(
      ssePresets.find((item) => item.id === 'tricky')?.value ?? '',
    );

    expect(
      result.diagnostics.some(
        (item) => item.level === 'error' && item.message.includes('结尾空行'),
      ),
    ).toBe(true);
  });

  it('treats connection-only frames as silent rather than broken', () => {
    const result = parseSseStream('retry: 3000\n\n: ping\n\ndata: ok\n\n');

    expect(result.frames[0].silent).toBe(true);
    expect(result.frames[0].reason).toContain('连接级指令');
    expect(result.dispatched.map((frame) => frame.data)).toEqual(['ok']);
  });

  it('drops the trailing frame when the stream ends without a blank line', () => {
    const result = parseSseStream('data: kept\n\ndata: dropped');

    expect(result.dispatched).toHaveLength(1);
    expect(result.dispatched[0].data).toBe('kept');
    expect(result.frames[1].reason).toContain('结尾空行');
    expect(result.diagnostics.some((item) => item.level === 'error')).toBe(
      true,
    );
  });

  it('keeps the last event id across frames and rejects NULL ids', () => {
    const result = parseSseStream(
      'id: 7\ndata: a\n\nid: bad\u0000id\ndata: b\n\n',
    );

    expect(result.lastEventId).toBe('7');
    expect(result.dispatched[1].lastEventId).toBe('7');
    expect(
      result.diagnostics.some((item) => item.message.includes('NULL')),
    ).toBe(true);
  });

  it('ignores a non-numeric retry value', () => {
    const result = parseSseStream('retry: abc\ndata: x\n\n');

    expect(result.reconnectionTime).toBeNull();
    expect(
      result.diagnostics.some((item) => item.message.includes('retry')),
    ).toBe(true);
  });

  it('handles CRLF, CR and LF terminators', () => {
    const result = parseSseStream('data: a\r\n\r\ndata: b\r\rdata: c\n\n');

    expect(result.terminators).toEqual({ cr: 2, crlf: 2, lf: 2 });
    expect(result.dispatched.map((frame) => frame.data)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('flags mixed line terminators', () => {
    const result = parseSseStream('data: a\r\n\r\ndata: b\n\n');

    expect(
      result.diagnostics.some((item) => item.message.includes('换行符混用')),
    ).toBe(true);
  });

  it('strips the BOM before parsing', () => {
    const result = parseSseStream('\uFEFFdata: a\n\n');

    expect(result.hasBom).toBe(true);
    expect(result.dispatched[0].data).toBe('a');
  });

  it('strips exactly one leading space from field values', () => {
    const result = parseSseStream('data:  padded\n\n');

    expect(result.dispatched[0].data).toBe(' padded');
  });

  it('reports an empty stream without data fields', () => {
    const result = parseSseStream(': only a comment\n\n');

    expect(result.dispatched).toHaveLength(0);
    expect(result.diagnostics.some((item) => item.level === 'error')).toBe(
      true,
    );
  });
});

describe('SSE client code builder', () => {
  it('emits curl, EventSource and fetch artifacts', () => {
    const code = buildSseClientCode({
      url: 'https://api.example.com/stream',
      events: parseSseStream('event: tick\ndata: 1\n\n').frames,
    });

    expect(code.curl).toContain('curl -N \\');
    expect(code.curl).toContain("'https://api.example.com/stream'");
    expect(code.eventSource).toContain('new EventSource');
    expect(code.eventSource).toContain('source.addEventListener("tick"');
    expect(code.fetch).toContain('getReader()');
  });

  it('falls back to a placeholder url when none is given', () => {
    const code = buildSseClientCode({ url: '   ', events: [] });

    expect(code.curl).toContain('https://api.example.com/stream');
    expect(code.eventSource).not.toContain('addEventListener');
  });
});
