import type { Monaco } from '@monaco-editor/react';

export const SSE_LANGUAGE_ID = 'sse';

export type SseTokenKind =
  | 'comment'
  | 'delimiter'
  | 'invalid'
  | 'keyword'
  | 'string';

export interface SseTokenizeResult {
  /** 空行返回空字符串。 */
  field: SseTokenKind | '';
  tokens: Array<{ kind: SseTokenKind; value: string }>;
}

const KNOWN = ['event', 'data', 'id', 'retry'];

/**
 * 与 Monaco Monarch 规则保持一致地对单行做词法切分，
 * 抽成纯函数以便直接测试。
 */
export function tokenizeSseLine(line: string): SseTokenizeResult {
  if (line.trim() === '') {
    return { field: '', tokens: [] };
  }

  if (line.startsWith(':')) {
    return { field: 'comment', tokens: [{ kind: 'comment', value: line }] };
  }

  const colon = line.indexOf(':');

  if (colon === -1) {
    const known = KNOWN.includes(line);
    const kind: SseTokenKind = known ? 'keyword' : 'invalid';

    return { field: kind, tokens: [{ kind, value: line }] };
  }

  const field = line.slice(0, colon);
  const rest = line.slice(colon + 1);
  const kind: SseTokenKind = KNOWN.includes(field) ? 'keyword' : 'invalid';

  return {
    field: kind,
    tokens: [
      { kind, value: field },
      { kind: 'delimiter', value: ':' },
      ...(rest === '' ? [] : [{ kind: 'string' as const, value: rest }]),
    ],
  };
}

/**
 * 为 Monaco 注册 SSE 语法：标准字段、注释、未知字段分别着色，
 * 让「这段流浏览器会怎么读」在输入时就能直接看出来。
 */
export function registerSseLanguage(monaco: Monaco): void {
  if (
    monaco.languages
      .getLanguages()
      .some((item: { id: string }) => item.id === SSE_LANGUAGE_ID)
  ) {
    return;
  }

  monaco.languages.register({
    id: SSE_LANGUAGE_ID,
    extensions: ['.sse'],
    aliases: ['Server-Sent Events', 'EventStream'],
  });

  monaco.languages.setLanguageConfiguration(SSE_LANGUAGE_ID, {
    autoClosingPairs: [{ open: '{', close: '}' }],
    brackets: [],
    comments: { lineComment: ':' },
  });

  monaco.languages.setMonarchTokensProvider(SSE_LANGUAGE_ID, {
    defaultToken: 'invalid',
    tokenPostfix: '.sse',
    tokenizer: {
      root: [
        [/^\s*$/, ''],
        [/^:.*$/, 'comment'],
        [/^(event|data|id|retry)(:)/, ['keyword', 'delimiter']],
        [/^(event|data|id|retry)$/, 'keyword'],
        [/^([\w-]+)(:)/, ['invalid', 'delimiter']],
        [/^.*$/, 'invalid'],
      ],
    },
  });
}
