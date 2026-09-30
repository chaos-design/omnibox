export type QueryValue = string | string[];

export interface ParsedUrl {
  hash: string;
  host: string;
  hostname: string;
  href: string;
  origin: string;
  password: string;
  pathname: string;
  port: string;
  protocol: string;
  query: Record<string, QueryValue>;
  search: string;
  username: string;
}

export function queryToObject(input: string): Record<string, QueryValue> {
  const source = input.trim().replace(/^\?/u, '');
  const values = new Map<string, string[]>();

  for (const [key, value] of new URLSearchParams(source)) {
    const existing = values.get(key);

    if (existing) {
      existing.push(value);
    } else {
      values.set(key, [value]);
    }
  }

  return Object.fromEntries(
    Array.from(values, ([key, items]) => [
      key,
      items.length === 1 ? items[0] : items,
    ]),
  );
}

function normalizeQuerySource(
  input: string | unknown,
): Record<string, unknown> {
  let value = input;

  if (typeof input === 'string') {
    const source = input.trim();

    if (!source) {
      throw new Error('请输入查询参数 JSON。');
    }

    try {
      value = JSON.parse(source);
    } catch {
      throw new Error('查询参数 JSON 格式无效。');
    }
  }

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('查询参数必须是 JSON 对象。');
  }

  return value as Record<string, unknown>;
}

function appendQueryValue(
  searchParams: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value === null) {
    searchParams.append(key, '');
    return;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    searchParams.append(key, String(value));
    return;
  }

  throw new Error(
    `查询参数“${key}”只支持字符串、数字、布尔值、null 或这些值的数组。`,
  );
}

export function objectToQuery(input: string | unknown): string {
  const value = normalizeQuerySource(input);
  const searchParams = new URLSearchParams();

  for (const [key, item] of Object.entries(value)) {
    if (Array.isArray(item)) {
      for (const child of item) {
        appendQueryValue(searchParams, key, child);
      }
    } else {
      appendQueryValue(searchParams, key, item);
    }
  }

  return searchParams.toString();
}

export function parseUrl(input: string): ParsedUrl {
  const source = input.trim();

  if (!source) {
    throw new Error('请输入完整 URL。');
  }

  try {
    const url = new URL(source);

    return {
      hash: url.hash,
      host: url.host,
      hostname: url.hostname,
      href: url.href,
      origin: url.origin,
      password: url.password,
      pathname: url.pathname,
      port: url.port,
      protocol: url.protocol,
      query: queryToObject(url.search),
      search: url.search,
      username: url.username,
    };
  } catch {
    throw new Error('URL 格式无效，请包含协议和主机名。');
  }
}
