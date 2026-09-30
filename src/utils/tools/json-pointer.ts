export type JsonPointerOperation = 'add' | 'replace' | 'remove';

type JsonContainer = Record<string, unknown> | unknown[];

function parseJson(input: string): unknown {
  if (!input.trim()) {
    throw new Error('请输入 JSON 内容。');
  }

  try {
    return JSON.parse(input);
  } catch {
    throw new Error('JSON 格式无效。');
  }
}

export function parseJsonPointer(pointer: string): string[] {
  if (pointer === '') {
    return [];
  }

  if (!pointer.startsWith('/')) {
    throw new Error('JSON Pointer 必须为空或以 / 开头。');
  }

  return pointer
    .slice(1)
    .split('/')
    .map((token) => {
      if (/~(?:[^01]|$)/u.test(token)) {
        throw new Error('JSON Pointer 仅支持 ~0 和 ~1 转义。');
      }

      return token.replace(/~1/gu, '/').replace(/~0/gu, '~');
    });
}

function readArrayIndex(
  token: string,
  length: number,
  allowEnd = false,
): number {
  if (!/^(?:0|[1-9]\d*)$/u.test(token)) {
    throw new Error(`数组索引“${token}”无效。`);
  }

  const index = Number(token);
  const maximum = allowEnd ? length : length - 1;

  if (!Number.isSafeInteger(index) || index < 0 || index > maximum) {
    throw new Error(`数组索引“${token}”超出范围。`);
  }

  return index;
}

function readChild(container: unknown, token: string): unknown {
  if (Array.isArray(container)) {
    return container[readArrayIndex(token, container.length)];
  }

  if (typeof container === 'object' && container !== null) {
    if (!Object.hasOwn(container, token)) {
      throw new Error(`JSON Pointer 路径“${token}”不存在。`);
    }

    return Reflect.get(container, token);
  }

  throw new Error(`无法在非容器值上继续访问“${token}”。`);
}

function resolveValue(root: unknown, tokens: string[]): unknown {
  return tokens.reduce(readChild, root);
}

export function resolveJsonPointer(input: string, pointer: string): unknown {
  return resolveValue(parseJson(input), parseJsonPointer(pointer));
}

function assertContainer(value: unknown): asserts value is JsonContainer {
  if (typeof value !== 'object' || value === null) {
    throw new Error('JSON Pointer 的父路径不是对象或数组。');
  }
}

function setObjectProperty(
  object: Record<string, unknown>,
  key: string,
  value: unknown,
): void {
  Object.defineProperty(object, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

export function mutateJsonPointer(
  input: string,
  pointer: string,
  operation: JsonPointerOperation,
  value?: unknown,
): string {
  const root = structuredClone(parseJson(input));
  const tokens = parseJsonPointer(pointer);

  if (operation !== 'remove' && value === undefined) {
    throw new Error(`${operation} 操作必须提供 JSON 值。`);
  }

  if (tokens.length === 0) {
    return JSON.stringify(operation === 'remove' ? null : value, null, 2);
  }

  const token = tokens.at(-1) ?? '';
  const parent = resolveValue(root, tokens.slice(0, -1));
  assertContainer(parent);

  if (Array.isArray(parent)) {
    if (operation === 'add') {
      if (token === '-') {
        parent.push(value);
      } else {
        parent.splice(readArrayIndex(token, parent.length, true), 0, value);
      }
    } else {
      const index = readArrayIndex(token, parent.length);

      if (operation === 'replace') {
        parent[index] = value;
      } else {
        parent.splice(index, 1);
      }
    }
  } else if (operation === 'add') {
    setObjectProperty(parent, token, value);
  } else {
    if (!Object.hasOwn(parent, token)) {
      throw new Error(`JSON Pointer 路径“${token}”不存在。`);
    }

    if (operation === 'replace') {
      setObjectProperty(parent, token, value);
    } else {
      Reflect.deleteProperty(parent, token);
    }
  }

  return JSON.stringify(root, null, 2);
}
