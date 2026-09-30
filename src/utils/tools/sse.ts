const KNOWN_FIELDS = new Set(['event', 'data', 'id', 'retry']);
const NULL_CHARACTER = '\u0000';
const DIGITS_PATTERN = /^\d+$/u;

export type SseDiagnosticLevel = 'error' | 'warning' | 'info';

export interface SseDiagnostic {
  level: SseDiagnosticLevel;
  line: number | null;
  message: string;
}

export type SseTraceLineKind = 'blank' | 'comment' | 'field';

export interface SseTraceLine {
  /** 文档绝对行号，1 起始 */
  index: number;
  kind: SseTraceLineKind;
  field: string;
  value: string;
  known: boolean;
  /** 原始文本，不含换行符 */
  raw: string;
  /** `\n` / `\r\n` / `\r`，流末尾行为空字符串 */
  terminator: string;
  /** 人类可读的处理说明 */
  effect: string;
  /** 所属帧序号（1 起始），不属于任何帧时为 null */
  frame: number | null;
}

export interface SsePreset {
  id: string;
  label: string;
  value: string;
}

export interface SseFramePayload {
  error: string;
  isJson: boolean;
  text: string;
}

export interface SseFrame {
  index: number;
  startLine: number;
  endLine: number;
  /** 事件类型，缺省 message */
  type: string;
  data: string;
  dataLines: number;
  /** 本帧显式携带的 id 字段 */
  id: string | null;
  /** 派发时刻生效的 Last-Event-ID */
  lastEventId: string;
  retry: number | null;
  dispatched: boolean;
  /**
   * 尚未收到结尾空行，浏览器此刻还无法判定该事件完整。
   * 仅在按行模拟到达（revealLines）时可能出现。
   */
  streaming: boolean;
  /**
   * 未派发且不属于协议错误。
   * 仅含 retry / id 等连接级指令的帧按规范本就不产生事件，
   * 显式声明 event 却缺 data 才是真正的问题。
   */
  silent: boolean;
  /** 未派发原因，已派发时为空字符串 */
  reason: string;
  payload: SseFramePayload;
  bytes: number;
}

export interface SseLineTerminators {
  cr: number;
  crlf: number;
  lf: number;
}

export interface SseParseOptions {
  /**
   * 只解析 body 的前 N 行，用于模拟数据逐块到达。
   * 缺省时解析全部内容。
   */
  revealLines?: number;
}

export interface SseStreamResult {
  lines: SseTraceLine[];
  frames: SseFrame[];
  dispatched: SseFrame[];
  /** 因 revealLines 截断，最后一帧处于接收中 */
  truncated: boolean;
  /** 流总行数，用于播放进度 */
  totalLines: number;
  lastEventId: string;
  reconnectionTime: number | null;
  hasBom: boolean;
  byteLength: number;
  comments: number;
  terminators: SseLineTerminators;
  diagnostics: SseDiagnostic[];
}

interface RawLine {
  text: string;
  terminator: string;
}

interface PendingFrame {
  index: number;
  startLine: number;
  data: string;
  dataLines: number;
  type: string;
  id: string | null;
  retry: number | null;
  bytes: number;
}

const encoder = new TextEncoder();

function toByteLength(value: string): number {
  return encoder.encode(value).length;
}

function splitLines(source: string): RawLine[] {
  const lines: RawLine[] = [];
  let start = 0;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    let terminator = '';

    if (character === '\n') {
      terminator = '\n';
    } else if (character === '\r') {
      terminator = source[index + 1] === '\n' ? '\r\n' : '\r';
    } else {
      continue;
    }

    lines.push({ text: source.slice(start, index), terminator });
    index += terminator.length - 1;
    start = index + 1;
  }

  if (start < source.length) {
    lines.push({ text: source.slice(start), terminator: '' });
  }

  return lines;
}

function splitField(raw: string): { field: string; value: string } {
  const colon = raw.indexOf(':');

  if (colon === -1) {
    return { field: raw, value: '' };
  }

  const value = raw.slice(colon + 1);
  return {
    field: raw.slice(0, colon),
    value: value.startsWith(' ') ? value.slice(1) : value,
  };
}

function inspectPayload(data: string): SseFramePayload {
  if (data.trim() === '') {
    return { error: '', isJson: false, text: '' };
  }

  try {
    return {
      error: '',
      isJson: true,
      text: JSON.stringify(JSON.parse(data), null, 2),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      isJson: false,
      text: data,
    };
  }
}

/**
 * 按 WHATWG HTML「server-sent events」解析流程逐行解释 SSE 事件流，
 * 输出行级 trace、帧级结果与协议诊断。纯函数，不发起任何网络请求。
 *
 * `revealLines` 让解析只进行到第 N 行，从而复现
 * 「事件在收到结尾空行前无法判定完整」这一真实接收过程。
 */
export function parseSseStream(
  input: string,
  options: SseParseOptions = {},
): SseStreamResult {
  const diagnostics: SseDiagnostic[] = [];
  const hasBom = input.startsWith('\uFEFF');
  const source = hasBom ? input.slice(1) : input;
  const allLines = splitLines(source);

  const totalLines = allLines.length;
  const revealLines = options.revealLines;
  const truncated = revealLines !== undefined && revealLines < totalLines;
  const visibleCount = truncated
    ? Math.max(0, Math.min(revealLines ?? 0, totalLines))
    : totalLines;
  const rawLines = allLines.slice(0, visibleCount);

  const lines: SseTraceLine[] = [];
  const frames: SseFrame[] = [];
  const terminators: SseLineTerminators = { cr: 0, crlf: 0, lf: 0 };

  let pending: PendingFrame | null = null;
  let lastEventId = '';
  let reconnectionTime: number | null = null;
  let comments = 0;
  let unknownFields = 0;
  let droppedIds = 0;
  let droppedRetries = 0;
  let hasDataField = false;

  /**
   * 结束当前帧。
   * `terminated` 表示遇到了空行；`endLine` 是该帧占用的最后一行
   * （含结尾空行本身），播放按它逐事件推进。
   */
  const finalize = (terminated: boolean, endLine: number): void => {
    if (pending === null) {
      return;
    }

    const data = pending.data.endsWith('\n')
      ? pending.data.slice(0, -1)
      : pending.data;
    const streaming = !terminated && truncated;
    const dispatched = data !== '' && terminated;
    // 只声明了 event 却没有 data 才是真正的协议问题；
    // 纯 retry / id 帧不产生事件属于规范预期。
    const silent =
      !dispatched && !streaming && data === '' && pending.type === '';

    let reason = '';
    if (streaming) {
      reason = '接收中，尚未收到结尾空行，浏览器还不能派发该事件。';
    } else if (!dispatched) {
      reason = silent
        ? '仅含连接级指令（retry / id），按规范不产生事件。'
        : data === ''
          ? `声明了 event: ${pending.type} 但没有 data 字段，浏览器不会派发事件。`
          : '流在结尾空行之前结束，浏览器不会派发这段数据。';
    }

    frames.push({
      index: pending.index,
      startLine: pending.startLine,
      endLine,
      type: pending.type === '' ? 'message' : pending.type,
      data,
      dataLines: pending.dataLines,
      id: pending.id,
      lastEventId,
      retry: pending.retry,
      dispatched,
      streaming,
      silent,
      reason,
      payload: inspectPayload(data),
      bytes: pending.bytes,
    });

    pending = null;
  };

  rawLines.forEach((raw) => {
    const bytes = toByteLength(raw.text) + raw.terminator.length;
    const index = lines.length + 1;

    if (raw.terminator === '\r\n') {
      terminators.crlf += 1;
    } else if (raw.terminator === '\n') {
      terminators.lf += 1;
    } else if (raw.terminator === '\r') {
      terminators.cr += 1;
    }

    if (raw.text === '') {
      if (pending !== null) {
        // 空行本身属于被结束的这一帧，因此 endLine 含这一行。
        pending.bytes += bytes;
        const frameIndex = pending.index;
        finalize(true, index);
        lines.push({
          index,
          kind: 'blank',
          field: '',
          value: '',
          known: true,
          raw: '',
          terminator: raw.terminator,
          effect: '空行，结束当前帧。',
          frame: frameIndex,
        });
        return;
      }

      lines.push({
        index,
        kind: 'blank',
        field: '',
        value: '',
        known: true,
        raw: '',
        terminator: raw.terminator,
        effect: '空行，没有待处理帧，忽略。',
        frame: null,
      });
      return;
    }

    if (pending === null) {
      pending = {
        index: frames.length + 1,
        startLine: index,
        data: '',
        dataLines: 0,
        type: '',
        id: null,
        retry: null,
        bytes: 0,
      };
    }

    pending.bytes += bytes;

    if (raw.text.startsWith(':')) {
      comments += 1;
      lines.push({
        index,
        kind: 'comment',
        field: '',
        value: raw.text.slice(1).replace(/^ /u, ''),
        known: true,
        raw: raw.text,
        terminator: raw.terminator,
        effect: '注释行（常用于心跳保活），浏览器忽略。',
        frame: pending.index,
      });
      return;
    }

    const { field, value } = splitField(raw.text);
    const known = KNOWN_FIELDS.has(field);
    let effect = `未知字段 ${JSON.stringify(field)}，浏览器忽略。`;

    if (!known) {
      unknownFields += 1;
    }

    if (field === 'event') {
      pending.type = value;
      effect = `事件类型设为 ${value === '' ? 'message（空值回退）' : value}。`;
    } else if (field === 'data') {
      hasDataField = true;
      pending.data += `${value}\n`;
      pending.dataLines += 1;
      effect = `追加 data 并补一个换行，本帧累计 ${pending.dataLines} 行。`;
    } else if (field === 'id') {
      if (value.includes(NULL_CHARACTER)) {
        droppedIds += 1;
        effect = 'id 含 NULL 字符，浏览器忽略该值。';
      } else {
        pending.id = value;
        lastEventId = value;
        effect = `Last-Event-ID 更新为 ${value === '' ? '（空值）' : value}。`;
      }
    } else if (field === 'retry') {
      if (DIGITS_PATTERN.test(value)) {
        reconnectionTime = Number(value);
        pending.retry = reconnectionTime;
        effect = `重连间隔设为 ${reconnectionTime} ms。`;
      } else {
        droppedRetries += 1;
        effect = `retry 值 ${JSON.stringify(value)} 不是纯数字，浏览器忽略。`;
      }
    }

    lines.push({
      index,
      kind: 'field',
      field,
      value,
      known,
      raw: raw.text,
      terminator: raw.terminator,
      effect,
      frame: pending.index,
    });
  });

  // 流末尾：被截断的帧占用到最后一行可见内容。
  finalize(false, lines.length);

  const dispatched = frames.filter((frame) => frame.dispatched);

  if (hasBom) {
    diagnostics.push({
      level: 'info',
      line: null,
      message: '输入以 BOM 开头，按规范解析时已忽略。',
    });
  }

  if (source.trim() === '') {
    diagnostics.push({
      level: 'info',
      line: null,
      message: '输入为空，没有可解析的 SSE 帧。',
    });
  }

  const terminatorKinds = [
    terminators.crlf > 0,
    terminators.lf > 0,
    terminators.cr > 0,
  ].filter(Boolean).length;

  if (terminatorKinds > 1) {
    diagnostics.push({
      level: 'warning',
      line: null,
      message: `换行符混用（CRLF ${terminators.crlf} / LF ${terminators.lf} / CR ${terminators.cr}），建议统一为 CRLF 或 LF。`,
    });
  }

  if (unknownFields > 0) {
    diagnostics.push({
      level: 'warning',
      line: null,
      message: `存在 ${unknownFields} 个未知字段，浏览器会静默忽略。`,
    });
  }

  if (droppedIds > 0) {
    diagnostics.push({
      level: 'warning',
      line: null,
      message: `存在 ${droppedIds} 个含 NULL 字符的 id 字段，浏览器会忽略这些值。`,
    });
  }

  if (droppedRetries > 0) {
    diagnostics.push({
      level: 'warning',
      line: null,
      message: `存在 ${droppedRetries} 个非数字 retry 字段，浏览器会忽略这些值。`,
    });
  }

  if (!hasDataField && source.trim() !== '') {
    diagnostics.push({
      level: 'error',
      line: null,
      message: '整条响应没有 data 字段，不会产生任何事件。',
    });
  }

  for (const frame of frames) {
    if (frame.dispatched && !frame.payload.isJson && frame.data.trim() !== '') {
      diagnostics.push({
        level: 'info',
        line: frame.startLine,
        message: `第 ${frame.index} 帧的 data 不是合法 JSON，客户端需按纯文本处理。`,
      });
    }
  }

  const trailing = frames.at(-1);
  if (
    trailing !== undefined &&
    !trailing.dispatched &&
    !trailing.silent &&
    !trailing.streaming &&
    trailing.data !== ''
  ) {
    diagnostics.push({
      level: 'error',
      line: trailing.startLine,
      message: '最后一条事件缺少结尾空行，浏览器在连接关闭时不会派发这段数据。',
    });
  }

  return {
    lines,
    frames,
    dispatched,
    truncated,
    totalLines,
    lastEventId,
    reconnectionTime,
    hasBom,
    byteLength: toByteLength(input),
    comments,
    terminators,
    diagnostics,
  };
}

export interface SseClientCode {
  curl: string;
  eventSource: string;
  fetch: string;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/gu, `'\\''`)}'`;
}

/**
 * 依据解析出的事件类型生成消费端代码，覆盖原生 EventSource 与 fetch 流式解析两条链路。
 */
export function buildSseClientCode(input: {
  url: string;
  events: SseFrame[];
}): SseClientCode {
  const url = input.url.trim() || 'https://api.example.com/stream';
  const named = [
    ...new Set(
      input.events
        .map((event) => event.type)
        .filter((type) => type !== 'message'),
    ),
  ];

  const listeners = [
    'source.onmessage = (event) => {',
    '  console.log(event.lastEventId, event.data);',
    '};',
    ...named.map(
      (type) =>
        `source.addEventListener(${JSON.stringify(type)}, (event) => {\n  console.log(event.lastEventId, event.data);\n});`,
    ),
  ];

  return {
    curl: [
      'curl -N \\',
      "  -H 'Accept: text/event-stream' \\",
      "  -H 'Cache-Control: no-cache' \\",
      `  ${shellQuote(url)}`,
    ].join('\n'),
    eventSource: [
      `const source = new EventSource(${JSON.stringify(url)});`,
      '',
      ...listeners,
      '',
      'source.onerror = () => {',
      '  // readyState: 0 = CONNECTING 浏览器自动重连，2 = CLOSED 已关闭',
      "  console.log('连接状态', source.readyState);",
      '};',
    ].join('\n'),
    fetch: `const response = await fetch(${JSON.stringify(url)}, {
  headers: { Accept: 'text/event-stream' },
});

if (!response.body) {
  throw new Error('响应不包含可读流');
}

const reader = response.body
  .pipeThrough(new TextDecoderStream())
  .getReader();

let buffer = '';

const emit = (block) => {
  const data = [];
  let type = 'message';
  let id = '';

  for (const line of block.split(/\\r\\n|\\r|\\n/u)) {
    if (line === '' || line.startsWith(':')) {
      continue;
    }

    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = (colon === -1 ? '' : line.slice(colon + 1)).replace(/^ /u, '');

    if (field === 'data') {
      data.push(value);
    } else if (field === 'event') {
      type = value;
    } else if (field === 'id' && !value.includes('\\u0000')) {
      id = value;
    }
  }

  if (data.length === 0) {
    return;
  }

  console.log(type, id, data.join('\\n'));
};

for (;;) {
  const { done, value } = await reader.read();

  if (done) {
    break;
  }

  buffer += value;

  for (let match = buffer.match(/\\r\\n\\r\\n|\\n\\n|\\r\\r/u); match; match = buffer.match(/\\r\\n\\r\\n|\\n\\n|\\r\\r/u)) {
    emit(buffer.slice(0, match.index));
    buffer = buffer.slice(match.index + match[0].length);
  }
}`,
  };
}

export const ssePresets: SsePreset[] = [
  {
    id: 'standard',
    label: '标准事件流',
    value: `retry: 3000

: 服务端心跳

id: 101
event: open
data: {"stream":"demo","createdAt":1735689600000}

id: 102
event: delta
data: {"delta":"Hello"}

id: 103
event: delta
data: {"delta":", SSE"}

id: 104
event: done
data: {"reason":"finish"}

`,
  },
  {
    id: 'openai',
    label: 'OpenAI 风格增量',
    value: `: ping

data: {"id":"chatcmpl-1","choices":[{"index":0,"delta":{"role":"assistant"}}]}

data: {"id":"chatcmpl-1","choices":[{"index":0,"delta":{"content":"你"}}]}

data: {"id":"chatcmpl-1","choices":[{"index":0,"delta":{"content":"好"}}]}

data: [DONE]

`,
  },
  {
    id: 'tricky',
    label: '边界与陷阱',
    value: [
      '\uFEFF: BOM 会被忽略',
      'retry: 2500',
      '',
      'id: a-1',
      'event: tick',
      'data: {"seq":1}',
      '',
      'unknown-field: 未知字段会被忽略',
      'id: bad\u0000id',
      'retry: abc',
      'data: 多行 data 会在派发前用换行拼接',
      'data: 这是第二行',
      '',
      'event: no-data',
      'id: x-9',
      '',
      'data: {"seq":2,"note":"结尾缺少空行，浏览器不会派发"}',
    ].join('\r\n'),
  },
];
