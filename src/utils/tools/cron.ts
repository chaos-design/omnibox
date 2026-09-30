export type CronFieldKey =
  | 'minute'
  | 'hour'
  | 'dayOfMonth'
  | 'month'
  | 'dayOfWeek';

export interface CronFieldResult {
  description: string;
  key: CronFieldKey;
  label: string;
  value: string;
}

export interface CronResult {
  expression: string;
  fields: CronFieldResult[];
  summary: string;
}

interface CronFieldDefinition {
  key: CronFieldKey;
  label: string;
  maximum: number;
  minimum: number;
  unit: string;
}

const fieldDefinitions: CronFieldDefinition[] = [
  { key: 'minute', label: '分钟', minimum: 0, maximum: 59, unit: '分钟' },
  { key: 'hour', label: '小时', minimum: 0, maximum: 23, unit: '小时' },
  {
    key: 'dayOfMonth',
    label: '日期',
    minimum: 1,
    maximum: 31,
    unit: '日',
  },
  { key: 'month', label: '月份', minimum: 1, maximum: 12, unit: '月' },
  {
    key: 'dayOfWeek',
    label: '星期',
    minimum: 0,
    maximum: 7,
    unit: '星期',
  },
];

function parseNumber(value: string, definition: CronFieldDefinition): number {
  if (!/^\d+$/u.test(value)) {
    throw new Error(`${definition.label}字段包含非法值“${value}”。`);
  }

  const number = Number(value);

  if (number < definition.minimum || number > definition.maximum) {
    throw new Error(
      `${definition.label}字段必须在 ${definition.minimum} 到 ${definition.maximum} 之间。`,
    );
  }

  return number;
}

function describeBase(value: string, definition: CronFieldDefinition): string {
  if (value === '*') {
    return `任意${definition.unit}`;
  }

  if (value.includes('-')) {
    const segments = value.split('-');

    if (segments.length !== 2) {
      throw new Error(`${definition.label}范围格式无效。`);
    }

    const start = parseNumber(segments[0], definition);
    const end = parseNumber(segments[1], definition);

    if (start > end) {
      throw new Error(`${definition.label}范围起始值不能大于结束值。`);
    }

    return `${start} 到 ${end} ${definition.unit}`;
  }

  return `${parseNumber(value, definition)} ${definition.unit}`;
}

function describePart(value: string, definition: CronFieldDefinition): string {
  const segments = value.split('/');

  if (segments.length > 2) {
    throw new Error(`${definition.label}步长格式无效。`);
  }

  const base = segments[0];
  const baseDescription = describeBase(base, definition);

  if (segments.length === 1) {
    return baseDescription;
  }

  const stepSource = segments[1];

  if (!/^\d+$/u.test(stepSource)) {
    throw new Error(`${definition.label}步长必须是正整数。`);
  }

  const step = Number(stepSource);
  const fieldSize = definition.maximum - definition.minimum + 1;

  if (step < 1 || step > fieldSize) {
    throw new Error(`${definition.label}步长必须在 1 到 ${fieldSize} 之间。`);
  }

  return `${baseDescription}，每隔 ${step} ${definition.unit}`;
}

function validateField(
  value: string,
  definition: CronFieldDefinition,
): CronFieldResult {
  if (!value || /\s/u.test(value)) {
    throw new Error(`${definition.label}字段不能为空或包含空格。`);
  }

  const parts = value.split(',');

  if (parts.some((part) => !part)) {
    throw new Error(`${definition.label}列表包含空项。`);
  }

  return {
    description: parts.map((part) => describePart(part, definition)).join('；'),
    key: definition.key,
    label: definition.label,
    value,
  };
}

function createSummary(expression: string): string {
  const presets: Record<string, string> = {
    '* * * * *': '每分钟执行',
    '0 * * * *': '每小时整点执行',
    '0 0 * * *': '每天 00:00 执行',
    '0 0 * * 1': '每周一 00:00 执行',
    '0 0 1 * *': '每月 1 日 00:00 执行',
  };

  return presets[expression] ?? '按下列五个字段组合执行';
}

export function parseCron(input: string): CronResult {
  const values = input.trim().split(/\s+/u);

  if (values.length !== 5) {
    throw new Error(
      'Cron 表达式必须包含分钟、小时、日期、月份、星期五个字段。',
    );
  }

  const fields = fieldDefinitions.map((definition, index) =>
    validateField(values[index], definition),
  );
  const expression = values.join(' ');

  return {
    expression,
    fields,
    summary: createSummary(expression),
  };
}

export function buildCron(values: Record<CronFieldKey, string>): CronResult {
  return parseCron(
    fieldDefinitions.map((definition) => values[definition.key]).join(' '),
  );
}
