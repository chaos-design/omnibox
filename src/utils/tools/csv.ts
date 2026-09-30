export type CsvDelimiter = ',' | ';' | '\t';

interface CsvOptions {
  delimiter?: CsvDelimiter;
  header?: boolean;
}

type CsvScalar = boolean | null | number | string;

function parseRows(input: string, delimiter: CsvDelimiter): string[][] {
  const source = input.replace(/^\uFEFF/u, '');

  if (!source.trim()) {
    throw new Error('请输入 CSV 内容。');
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let quotedFieldClosed = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
        quotedFieldClosed = true;
      } else {
        field += character;
      }

      continue;
    }

    if (character === '"') {
      if (field || quotedFieldClosed) {
        throw new Error(`第 ${rows.length + 1} 行包含位置错误的引号。`);
      }

      inQuotes = true;
      continue;
    }

    if (character === delimiter) {
      row.push(field);
      field = '';
      quotedFieldClosed = false;
      continue;
    }

    if (character === '\n' || character === '\r') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      quotedFieldClosed = false;

      if (character === '\r' && source[index + 1] === '\n') {
        index += 1;
      }

      continue;
    }

    if (quotedFieldClosed) {
      throw new Error(`第 ${rows.length + 1} 行引号字段后存在非法字符。`);
    }

    field += character;
  }

  if (inQuotes) {
    throw new Error('CSV 包含未闭合的引号字段。');
  }

  if (field || row.length > 0 || quotedFieldClosed) {
    row.push(field);
    rows.push(row);
  }

  const columnCount = rows[0]?.length ?? 0;

  rows.forEach((item, index) => {
    if (item.length !== columnCount) {
      throw new Error(
        `第 ${index + 1} 行有 ${item.length} 列，预期 ${columnCount} 列。`,
      );
    }
  });

  return rows;
}

function validateHeaders(headers: string[]): void {
  if (headers.some((header) => !header.trim())) {
    throw new Error('CSV 表头不能为空。');
  }

  if (new Set(headers).size !== headers.length) {
    throw new Error('CSV 表头不能重复。');
  }
}

export function csvToJson(input: string, options: CsvOptions = {}): string {
  const { delimiter = ',', header = true } = options;
  const rows = parseRows(input, delimiter);

  if (!header) {
    return JSON.stringify(rows, null, 2);
  }

  const [headers = [], ...values] = rows;
  validateHeaders(headers);

  return JSON.stringify(
    values.map((row) =>
      Object.fromEntries(headers.map((name, index) => [name, row[index]])),
    ),
    null,
    2,
  );
}

function parseJsonArray(input: string): unknown[] {
  if (!input.trim()) {
    throw new Error('请输入 JSON 数组。');
  }

  let value: unknown;

  try {
    value = JSON.parse(input);
  } catch {
    throw new Error('JSON 格式无效。');
  }

  if (!Array.isArray(value)) {
    throw new Error('JSON 顶层必须是数组。');
  }

  return value;
}

function toScalar(value: unknown, location: string): CsvScalar {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  throw new Error(`${location} 包含嵌套对象或数组，无法转换为 CSV。`);
}

function escapeField(value: CsvScalar, delimiter: CsvDelimiter): string {
  const source = value === null ? '' : String(value);

  if (
    source.includes(delimiter) ||
    source.includes('"') ||
    source.includes('\n') ||
    source.includes('\r')
  ) {
    return `"${source.replace(/"/gu, '""')}"`;
  }

  return source;
}

export function jsonToCsv(
  input: string,
  options: Pick<CsvOptions, 'delimiter'> = {},
): string {
  const delimiter = options.delimiter ?? ',';
  const value = parseJsonArray(input);

  if (value.length === 0) {
    return '';
  }

  if (value.every(Array.isArray)) {
    const rows = value as unknown[][];
    const columnCount = rows[0].length;

    return rows
      .map((row, rowIndex) => {
        if (row.length !== columnCount) {
          throw new Error(`第 ${rowIndex + 1} 行列数不一致。`);
        }

        return row
          .map((item, columnIndex) =>
            escapeField(
              toScalar(item, `第 ${rowIndex + 1} 行第 ${columnIndex + 1} 列`),
              delimiter,
            ),
          )
          .join(delimiter);
      })
      .join('\n');
  }

  if (
    !value.every(
      (item) =>
        typeof item === 'object' && item !== null && !Array.isArray(item),
    )
  ) {
    throw new Error('JSON 必须是对象数组或二维数组。');
  }

  const objects = value as Array<Record<string, unknown>>;
  const headers = Array.from(
    new Set(objects.flatMap((item) => Object.keys(item))),
  );
  const lines = [
    headers.map((header) => escapeField(header, delimiter)).join(delimiter),
  ];

  objects.forEach((item, rowIndex) => {
    lines.push(
      headers
        .map((header) =>
          escapeField(
            toScalar(
              item[header] ?? null,
              `第 ${rowIndex + 1} 个对象的“${header}”`,
            ),
            delimiter,
          ),
        )
        .join(delimiter),
    );
  });

  return lines.join('\n');
}
