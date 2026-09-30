const allowedFlags = new Set(['g', 'i', 'm', 's', 'u', 'y']);

export const MAX_PATTERN_LENGTH = 500;
export const MAX_INPUT_LENGTH = 50_000;
export const MAX_REPLACEMENT_LENGTH = 50_000;
const MAX_REGEX_TIMEOUT_MS = 2_000;

export interface RegexMatch {
  captures: Array<string | null>;
  groups: Record<string, string | null>;
  index: number;
  value: string;
}

export interface RegexTestResult {
  matches: RegexMatch[];
  truncated: boolean;
}

function validateFlags(flags: string): void {
  const values = Array.from(flags);

  if (
    values.some((flag) => !allowedFlags.has(flag)) ||
    new Set(values).size !== values.length
  ) {
    throw new Error('正则 flags 只能包含且不能重复使用 g、i、m、s、u、y。');
  }
}

export function createRegex(pattern: string, flags = ''): RegExp {
  validateFlags(flags);

  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new Error(`正则表达式长度不能超过 ${MAX_PATTERN_LENGTH} 个字符。`);
  }

  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`正则表达式无效：${reason}`);
  }
}

function nextStringIndex(
  input: string,
  index: number,
  unicode: boolean,
): number {
  if (!unicode || index + 1 >= input.length) {
    return index + 1;
  }

  const first = input.charCodeAt(index);

  if (first < 0xd800 || first > 0xdbff) {
    return index + 1;
  }

  const second = input.charCodeAt(index + 1);
  return second >= 0xdc00 && second <= 0xdfff ? index + 2 : index + 1;
}

export function testRegex(
  pattern: string,
  flags: string,
  input: string,
  limit = 200,
): RegexTestResult {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('匹配数量限制必须是正整数。');
  }

  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error(`测试文本长度不能超过 ${MAX_INPUT_LENGTH} 个字符。`);
  }

  const expression = createRegex(pattern, flags);
  const matches: RegexMatch[] = [];
  let match = expression.exec(input);

  while (match && matches.length < limit) {
    matches.push({
      captures: match
        .slice(1)
        .map((capture) => (capture === undefined ? null : capture)),
      groups: Object.fromEntries(
        Object.entries(match.groups ?? {}).map(([name, value]) => [
          name,
          value ?? null,
        ]),
      ),
      index: match.index,
      value: match[0],
    });

    if (!expression.global && !expression.sticky) {
      match = null;
      continue;
    }

    if (match[0] === '') {
      expression.lastIndex = nextStringIndex(
        input,
        expression.lastIndex,
        expression.unicode,
      );
    }

    match = expression.exec(input);
  }

  return {
    matches,
    truncated: match !== null,
  };
}

export function replaceRegex(
  pattern: string,
  flags: string,
  input: string,
  replacement: string,
): string {
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error(`测试文本长度不能超过 ${MAX_INPUT_LENGTH} 个字符。`);
  }

  if (replacement.length > MAX_REPLACEMENT_LENGTH) {
    throw new Error(`替换模板长度不能超过 ${MAX_REPLACEMENT_LENGTH} 个字符。`);
  }

  return input.replace(createRegex(pattern, flags), replacement);
}

type RegexWorkerRequest = RegexWorkerPayload & { id: number };

type RegexWorkerPayload =
  | {
      type: 'test';
      pattern: string;
      flags: string;
      input: string;
      limit: number;
    }
  | {
      type: 'replace';
      pattern: string;
      flags: string;
      input: string;
      replacement: string;
    };

interface RegexWorkerResponse {
  id: number;
  result?: RegexTestResult | string;
  error?: string;
}

interface PendingRegexRequest {
  reject: (reason: Error) => void;
  resolve: (value: RegexTestResult | string) => void;
  timer: number;
}

let regexWorker: Worker | null = null;
let regexWorkerRequestId = 0;
const pendingRegexRequests = new Map<number, PendingRegexRequest>();

function buildRegexWorkerSource(): string {
  return `
    var allowedFlags = new Set(${JSON.stringify(['g', 'i', 'm', 's', 'u', 'y'])});
    var MAX_PATTERN_LENGTH = ${MAX_PATTERN_LENGTH};
    var MAX_INPUT_LENGTH = ${MAX_INPUT_LENGTH};
    var MAX_REPLACEMENT_LENGTH = ${MAX_REPLACEMENT_LENGTH};
    ${validateFlags.toString()}
    ${createRegex.toString()}
    ${nextStringIndex.toString()}
    ${testRegex.toString()}
    ${replaceRegex.toString()}
    self.onmessage = function (event) {
      var message = event.data;
      try {
        var result;
        if (message.type === 'test') {
          result = testRegex(message.pattern, message.flags, message.input, message.limit);
        } else {
          result = replaceRegex(message.pattern, message.flags, message.input, message.replacement);
        }
        self.postMessage({ id: message.id, result: result });
      } catch (error) {
        self.postMessage({
          id: message.id,
          error: error && error.message ? String(error.message) : String(error)
        });
      }
    };
  `;
}

function terminateRegexWorker(reason: Error): void {
  for (const request of pendingRegexRequests.values()) {
    window.clearTimeout(request.timer);
    request.reject(reason);
  }

  pendingRegexRequests.clear();
  regexWorker?.terminate();
  regexWorker = null;
}

function getRegexWorker(): Worker {
  if (regexWorker) {
    return regexWorker;
  }

  const url = URL.createObjectURL(
    new Blob([buildRegexWorkerSource()], { type: 'text/javascript' }),
  );
  const worker = new Worker(url);

  worker.onmessage = (event: MessageEvent) => {
    const message = event.data as RegexWorkerResponse;
    const request = pendingRegexRequests.get(message.id);

    if (!request) {
      return;
    }

    pendingRegexRequests.delete(message.id);
    window.clearTimeout(request.timer);

    if (message.error) {
      request.reject(new Error(message.error));
    } else {
      request.resolve(message.result as RegexTestResult | string);
    }
  };

  worker.onerror = () => {
    terminateRegexWorker(new Error('正则执行器发生异常，已终止。'));
  };

  regexWorker = worker;
  return worker;
}

function postRegexRequest<T>(
  payload: RegexWorkerPayload,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = ++regexWorkerRequestId;
    const timer = window.setTimeout(() => {
      terminateRegexWorker(
        new Error(`正则执行超过 ${timeoutMs}ms 超时限制，已终止。`),
      );
    }, timeoutMs);

    pendingRegexRequests.set(id, {
      reject,
      resolve: resolve as (value: RegexTestResult | string) => void,
      timer,
    });
    getRegexWorker().postMessage({ id, ...payload } as RegexWorkerRequest);
  });
}

export function testRegexAsync(
  pattern: string,
  flags: string,
  input: string,
  limit = 200,
  timeoutMs = MAX_REGEX_TIMEOUT_MS,
): Promise<RegexTestResult> {
  return postRegexRequest<RegexTestResult>(
    { type: 'test', pattern, flags, input, limit },
    timeoutMs,
  );
}

export function replaceRegexAsync(
  pattern: string,
  flags: string,
  input: string,
  replacement: string,
  timeoutMs = MAX_REGEX_TIMEOUT_MS,
): Promise<string> {
  return postRegexRequest<string>(
    { type: 'replace', pattern, flags, input, replacement },
    timeoutMs,
  );
}
