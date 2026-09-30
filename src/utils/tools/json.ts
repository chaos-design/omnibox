import JSON5 from 'json5';

type JsonObject = Record<string, unknown>;

export interface JsonStatistics {
  arrays: number;
  bytes: number;
  keys: number;
  maxDepth: number;
  objects: number;
  values: number;
}

const identifierPattern = /^[A-Za-z_$][\w$]*$/;

const maxJsonDepth = 512;

function assertJsonDepth(depth: number): void {
  if (depth > maxJsonDepth) {
    throw new Error(`JSON 嵌套层级超过 ${maxJsonDepth} 层，已停止处理。`);
  }
}

const punctuationMap: Record<string, string> = {
  '，': ',',
  '。': '.',
  '！': '!',
  '？': '?',
  '：': ':',
  '；': ';',
  '“': '"',
  '”': '"',
  '‘': "'",
  '’': "'",
  '（': '(',
  '）': ')',
  '【': '[',
  '】': ']',
  '—': '-',
  '…': '...',
};

export function parseJSON(input: string): unknown {
  const source = input.trim();

  if (!source) {
    throw new SyntaxError('请输入 JSON 或 JavaScript 对象内容。');
  }

  try {
    return JSON.parse(source);
  } catch {
    return JSON5.parse(source);
  }
}

export function formatJSON(input: string): string {
  return JSON.stringify(parseJSON(input), null, 2);
}

function sortJsonValue(value: unknown, depth = 0): unknown {
  assertJsonDepth(depth);

  if (Array.isArray(value)) {
    return value.map((child) => sortJsonValue(child, depth + 1));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .toSorted(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortJsonValue(child, depth + 1)]),
    );
  }

  return value;
}

export function sortJSONKeys(input: string): string {
  return JSON.stringify(sortJsonValue(parseJSON(input)), null, 2);
}

export function getJSONStatistics(input: string): JsonStatistics {
  const root = parseJSON(input);
  const statistics: JsonStatistics = {
    arrays: 0,
    bytes: new TextEncoder().encode(input).length,
    keys: 0,
    maxDepth: 0,
    objects: 0,
    values: 0,
  };

  const visit = (value: unknown, depth: number) => {
    assertJsonDepth(depth);
    statistics.maxDepth = Math.max(statistics.maxDepth, depth);

    if (Array.isArray(value)) {
      statistics.arrays += 1;
      value.forEach((child) => visit(child, depth + 1));
      return;
    }

    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      statistics.objects += 1;
      statistics.keys += entries.length;
      entries.forEach(([, child]) => visit(child, depth + 1));
      return;
    }

    statistics.values += 1;
  };

  visit(root, 1);
  return statistics;
}

export function escapeJSON(input: string): string {
  return JSON.stringify(input).slice(1, -1);
}

export function unescapeJSON(input: string): string {
  let output = '';

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (character !== '\\' || index === input.length - 1) {
      output += character;
      continue;
    }

    const escape = input[index + 1];
    const simpleEscapes: Record<string, string> = {
      '\\': '\\',
      '"': '"',
      "'": "'",
      '/': '/',
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t',
    };

    if (escape === 'u') {
      const code = input.slice(index + 2, index + 6);

      if (/^[\dA-Fa-f]{4}$/.test(code)) {
        output += String.fromCharCode(Number.parseInt(code, 16));
        index += 5;
        continue;
      }
    }

    if (escape in simpleEscapes) {
      output += simpleEscapes[escape];
      index += 1;
      continue;
    }

    output += character;
  }

  return output;
}

export function compressJSON(input: string): string {
  return JSON.stringify(parseJSON(input));
}

export function compressAndEscapeJSON(input: string): string {
  return escapeJSON(compressJSON(input));
}

export function unicodeToChinese(input: string): string {
  return input.replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
    String.fromCharCode(Number.parseInt(match.slice(2), 16)),
  );
}

export function chineseToUnicode(input: string): string {
  return input.replace(/[^\x00-\x7F]/g, (character) => {
    const code = character.charCodeAt(0).toString(16).toUpperCase();
    return `\\u${code.padStart(4, '0')}`;
  });
}

export function chinesePunctuationToEnglish(
  input: string,
  escapeQuotes = false,
): string {
  return Array.from(input, (character) => {
    const replacement = punctuationMap[character] ?? character;

    if (escapeQuotes && (replacement === '"' || replacement === "'")) {
      return `\\${replacement}`;
    }

    return replacement;
  }).join('');
}

export function convert2JSON(input: string): string {
  return formatJSON(input);
}

export function isJSON(input: string): boolean {
  try {
    JSON.parse(input);
    return true;
  } catch {
    return false;
  }
}

function isSchemaUnsafeKey(key: string): boolean {
  return key in {};
}

function buildSchemaInput(
  value: unknown,
  placeholders: Map<string, string>,
  depth = 0,
): unknown {
  assertJsonDepth(depth);

  if (Array.isArray(value)) {
    return value.map((child) =>
      buildSchemaInput(child, placeholders, depth + 1),
    );
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
      const safeKey = isSchemaUnsafeKey(key)
        ? `\u0000omnibox-schema-key-${placeholders.size}`
        : key;

      if (safeKey !== key) {
        placeholders.set(safeKey, key);
      }

      result[safeKey] = buildSchemaInput(child, placeholders, depth + 1);
    }

    return result;
  }

  return value;
}

function restoreSchemaKeys(
  value: unknown,
  placeholders: Map<string, string>,
  depth = 0,
): unknown {
  assertJsonDepth(depth);

  if (Array.isArray(value)) {
    return value.map((child) =>
      restoreSchemaKeys(child, placeholders, depth + 1),
    );
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};

    for (const [key, child] of Object.entries(value)) {
      Object.defineProperty(result, placeholders.get(key) ?? key, {
        configurable: true,
        enumerable: true,
        value: restoreSchemaKeys(child, placeholders, depth + 1),
        writable: true,
      });
    }

    return result;
  }

  return value;
}

export async function json2Schema(
  value: string | JsonObject | unknown[],
  name = 'JsonSchema',
): Promise<unknown> {
  const json = typeof value === 'string' ? parseJSON(value) : value;
  const placeholders = new Map<string, string>();
  const safeValue = buildSchemaInput(json, placeholders);
  const generateSchema = await import('generate-schema');
  const schema = generateSchema.json(name, safeValue);

  return placeholders.size > 0
    ? restoreSchemaKeys(schema, placeholders)
    : schema;
}

function toPascalCase(value: string): string {
  const normalized = value
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[^A-Za-z\d]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return normalized || 'Generated';
}

function toTypeName(value: string): string {
  const name = toPascalCase(value);
  return identifierPattern.test(name) ? name : `Generated${name}`;
}

function toPropertyName(value: string): string {
  return identifierPattern.test(value) ? value : JSON.stringify(value);
}

function singularize(value: string): string {
  if (value.endsWith('ies')) {
    return `${value.slice(0, -3)}y`;
  }

  if (value.endsWith('s') && !value.endsWith('ss')) {
    return value.slice(0, -1);
  }

  return value;
}

class TypeScriptGenerator {
  private readonly definitions = new Map<string, string>();

  compile(value: unknown, name: string): string {
    const rootName = toTypeName(name);
    const rootType = this.resolveType(value, rootName, 0);

    if (!this.definitions.has(rootName)) {
      this.definitions.set(rootName, `export type ${rootName} = ${rootType};`);
    }

    return Array.from(this.definitions.values()).join('\n\n');
  }

  private resolveType(
    value: unknown,
    preferredName: string,
    depth: number,
  ): string {
    assertJsonDepth(depth);

    if (value === null) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return this.resolveArrayType(value, preferredName, depth);
    }

    if (typeof value === 'object') {
      return this.resolveObjectType(value as JsonObject, preferredName, depth);
    }

    if (typeof value === 'number') {
      return 'number';
    }

    if (
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return typeof value;
    }

    return 'unknown';
  }

  private resolveArrayType(
    values: unknown[],
    preferredName: string,
    depth: number,
  ): string {
    if (values.length === 0) {
      return 'unknown[]';
    }

    const itemName = `${toPascalCase(singularize(preferredName))}Item`;
    const itemTypes = new Set(
      values.map((value) => this.resolveType(value, itemName, depth + 1)),
    );
    const union = Array.from(itemTypes).join(' | ');

    return itemTypes.size > 1 ? `(${union})[]` : `${union}[]`;
  }

  private resolveObjectType(
    value: JsonObject,
    preferredName: string,
    depth: number,
  ): string {
    const typeName = this.getUniqueName(toPascalCase(preferredName), value);

    if (this.definitions.has(typeName)) {
      return typeName;
    }

    this.definitions.set(typeName, '');

    const properties = Object.entries(value).map(([key, child]) => {
      const childName = `${typeName}${toPascalCase(singularize(key))}`;
      return `  ${toPropertyName(key)}: ${this.resolveType(child, childName, depth + 1)};`;
    });
    const body = properties.length > 0 ? `\n${properties.join('\n')}\n` : '';

    this.definitions.set(typeName, `export interface ${typeName} {${body}}`);

    return typeName;
  }

  private getUniqueName(name: string, value: JsonObject): string {
    if (!this.definitions.has(name) || this.definitions.get(name) === '') {
      return name;
    }

    const signature = Object.keys(value).sort().join('|');
    let index = 2;
    let candidate = `${name}${index}`;

    while (this.definitions.has(candidate)) {
      const definition = this.definitions.get(candidate) ?? '';

      if (definition.includes(signature)) {
        return candidate;
      }

      index += 1;
      candidate = `${name}${index}`;
    }

    return candidate;
  }
}

export async function compileJSON(
  json: unknown,
  { name }: { name: string },
): Promise<string> {
  return new TypeScriptGenerator().compile(json, name);
}
