export interface HttpRequestInput {
  body?: string;
  headers?: Record<string, string>;
  method: string;
  url: string;
}

export interface HttpRequestArtifacts {
  curl: string;
  fetch: string;
  raw: string;
}

const headerNamePattern = /^[!#$%&'*+\-.^_`|~\dA-Za-z]+$/u;

function validateHeaders(
  headers: Record<string, unknown>,
): Record<string, string> {
  for (const [name, headerValue] of Object.entries(headers)) {
    if (!headerNamePattern.test(name)) {
      throw new Error(`Header 名称“${name}”无效。`);
    }

    if (typeof headerValue !== 'string') {
      throw new Error(`Header“${name}”的值必须是字符串。`);
    }

    if (/[\r\n]/u.test(headerValue)) {
      throw new Error(`Header“${name}”不能包含换行。`);
    }
  }

  return headers as Record<string, string>;
}

export function parseHeadersJson(input: string): Record<string, string> {
  if (!input.trim()) {
    return {};
  }

  let value: unknown;

  try {
    value = JSON.parse(input);
  } catch {
    throw new Error('Headers JSON 格式无效。');
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Headers 必须是 JSON 对象。');
  }

  const headers = value as Record<string, unknown>;
  return validateHeaders(headers);
}

function parseUrl(input: string): URL {
  let url: URL;

  try {
    url = new URL(input.trim());
  } catch {
    throw new Error('请输入包含 http:// 或 https:// 的绝对 URL。');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('HTTP 代码生成仅支持 http:// 和 https:// URL。');
  }

  return url;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/gu, `'\\''`)}'`;
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  return Object.keys(headers).some(
    (header) => header.toLowerCase() === name.toLowerCase(),
  );
}

function createCurl(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: string | undefined,
): string {
  const lines = [`curl -X ${method}`];

  Object.entries(headers).forEach(([name, value]) => {
    lines.push(`  -H ${shellQuote(`${name}: ${value}`)}`);
  });

  if (body !== undefined) {
    lines.push(`  --data-raw ${shellQuote(body)}`);
  }

  lines.push(`  ${shellQuote(url.toString())}`);
  return lines.join(' \\\n');
}

function createFetch(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: string | undefined,
): string {
  const properties = [`  method: ${JSON.stringify(method)}`];

  if (Object.keys(headers).length > 0) {
    const headerLines = JSON.stringify(headers, null, 2)
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    properties.push(`  headers: ${headerLines.trimStart()}`);
  }

  if (body !== undefined) {
    properties.push(`  body: ${JSON.stringify(body)}`);
  }

  return `const response = await fetch(${JSON.stringify(url.toString())}, {\n${properties.join(',\n')},\n});\n\nif (!response.ok) {\n  throw new Error(\`HTTP \${response.status}\`);\n}\n\nconst contentType = (response.headers.get('content-type') ?? '').toLowerCase();\nconst hasBody = ${method !== 'HEAD'} && response.status !== 204 && response.status !== 205;\nconst data = !hasBody\n  ? null\n  : contentType.includes('application/json') || contentType.includes('+json')\n    ? await response.json()\n    : contentType.startsWith('text/') || contentType.includes('xml')\n      ? await response.text()\n      : await response.blob();`;
}

function createRawRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: string | undefined,
): string {
  const path = `${url.pathname || '/'}${url.search}`;
  const lines = [`${method} ${path} HTTP/1.1`];

  if (!hasHeader(headers, 'host')) {
    lines.push(`Host: ${url.host}`);
  }

  Object.entries(headers).forEach(([name, value]) => {
    lines.push(`${name}: ${value}`);
  });

  if (body !== undefined && !hasHeader(headers, 'content-length')) {
    lines.push(`Content-Length: ${new TextEncoder().encode(body).length}`);
  }

  lines.push('');

  if (body !== undefined) {
    lines.push(body);
  }

  return lines.join('\r\n');
}

export function generateHttpRequest(
  input: HttpRequestInput,
): HttpRequestArtifacts {
  const method = input.method.trim().toUpperCase();

  if (!/^[A-Z]+$/u.test(method)) {
    throw new Error('HTTP 方法只能包含英文字母。');
  }

  const url = parseUrl(input.url);
  const headers = validateHeaders(input.headers ?? {});
  const body =
    method === 'GET' || method === 'HEAD' || !input.body
      ? undefined
      : input.body;

  return {
    curl: createCurl(method, url, headers, body),
    fetch: createFetch(method, url, headers, body),
    raw: createRawRequest(method, url, headers, body),
  };
}
