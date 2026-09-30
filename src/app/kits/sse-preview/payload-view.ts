import type { SseFrame } from '../../../utils/tools/sse';

/**
 * 抽屉里的 data 用 JSON 语法高亮；接收中的半截数据按纯文本处理，
 * 因为它尚未收完、无法被解析成 JSON。
 */
export function payloadLanguage(frame: SseFrame, partial: boolean): string {
  return !partial && frame.payload.isJson ? 'json' : 'plaintext';
}

/** 列表内 data 展示块的最大高度，与 index.module.scss 中的 max-height 保持一致。 */
export const PAYLOAD_MAX_HEIGHT = 132;

/**
 * 判断 data 展示块是否溢出、是否需要提供放大入口。
 * 依赖展示块具有 max-height + overflow-y: auto —— 缺少 max-height 时
 * scrollHeight 恒等于 clientHeight，放大入口将永不出现。
 */
export function isPayloadOverflowing(
  scrollHeight: number,
  clientHeight: number,
): boolean {
  return scrollHeight > clientHeight + 2;
}
