import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { parseSseStream, type SseFrame } from '../../../utils/tools/sse';

import {
  isPayloadOverflowing,
  PAYLOAD_MAX_HEIGHT,
  payloadLanguage,
} from './payload-view';

describe('payload overlay language', () => {
  const frameOf = (stream: string, revealLines?: number): SseFrame => {
    const result =
      revealLines === undefined
        ? parseSseStream(stream)
        : parseSseStream(stream, { revealLines });
    return result.frames[0];
  };

  it('uses json highlighting for a valid JSON payload', () => {
    const frame = frameOf('data: {"a":1}\n\n');

    expect(frame.payload.isJson).toBe(true);
    expect(payloadLanguage(frame, false)).toBe('json');
  });

  it('falls back to plaintext for non-JSON payloads', () => {
    expect(payloadLanguage(frameOf('data: hello\n\n'), false)).toBe(
      'plaintext',
    );
    expect(payloadLanguage(frameOf('data: [DONE]\n\n'), false)).toBe(
      'plaintext',
    );
  });

  it('never highlights a partially received payload as json', () => {
    // 接收中的半截 JSON 无法被解析，强行按 JSON 高亮会误导。
    const frame = frameOf('event: a\ndata: {"a":\n\n', 2);

    expect(frame.streaming).toBe(true);
    expect(frame.payload.isJson).toBe(false);
    expect(payloadLanguage(frame, true)).toBe('plaintext');
  });
});

describe('payload overflow detection', () => {
  it('reports overflow when content exceeds the capped height', () => {
    expect(isPayloadOverflowing(400, PAYLOAD_MAX_HEIGHT)).toBe(true);
  });

  it('reports no overflow when content fits', () => {
    expect(isPayloadOverflowing(60, PAYLOAD_MAX_HEIGHT)).toBe(false);
  });

  it('tolerates sub-pixel rounding at the boundary', () => {
    expect(
      isPayloadOverflowing(PAYLOAD_MAX_HEIGHT + 2, PAYLOAD_MAX_HEIGHT),
    ).toBe(false);
    expect(
      isPayloadOverflowing(PAYLOAD_MAX_HEIGHT + 3, PAYLOAD_MAX_HEIGHT),
    ).toBe(true);
  });

  it('never reports overflow when the box is uncapped', () => {
    // 没有 max-height 时 scrollHeight === clientHeight，
    // 这正是放大入口消失的根因，此处锁定该退化行为。
    const uncappedHeight = 5000;
    expect(isPayloadOverflowing(uncappedHeight, uncappedHeight)).toBe(false);
    expect(PAYLOAD_MAX_HEIGHT).toBeLessThan(uncappedHeight);
  });

  it('keeps the stylesheet max-height in sync with the constant', () => {
    // 两者不一致时 Overflow 判定阈值与实际渲染高度脱节，
    // 放大按钮会出现或消失但与真实内容长度不符。
    const stylesheet = readFileSync(
      new URL('./index.module.scss', import.meta.url),
      'utf8',
    );
    const block = /\.payload\s*\{([^}]*)\}/u.exec(stylesheet)?.[1] ?? '';

    expect(block).toContain(`max-height: ${PAYLOAD_MAX_HEIGHT}px`);
    expect(block).toContain('overflow-y: auto');
  });
});
