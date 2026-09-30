export type TimestampUnit = 'seconds' | 'milliseconds';

export interface TimestampResult {
  iso: string;
  local: string;
  milliseconds: string;
  seconds: string;
}

function pad(value: number, length = 2): string {
  return value.toString().padStart(length, '0');
}

export function formatLocalDateTime(date: Date): string {
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`,
  ].join(' ');
}

export function formatDateTimeLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toResult(milliseconds: number): TimestampResult {
  const normalizedMilliseconds = Math.trunc(milliseconds);
  const date = new Date(normalizedMilliseconds);

  if (
    !Number.isFinite(normalizedMilliseconds) ||
    Number.isNaN(date.getTime())
  ) {
    throw new Error('时间值超出 JavaScript Date 支持的范围。');
  }

  return {
    iso: date.toISOString(),
    local: formatLocalDateTime(date),
    milliseconds: normalizedMilliseconds.toString(),
    seconds: (normalizedMilliseconds / 1000).toString(),
  };
}

export function timestampToDate(
  input: string,
  unit: TimestampUnit,
): TimestampResult {
  const source = input.trim();

  if (!source) {
    throw new Error('请输入时间戳。');
  }

  const value = Number(source);

  if (!Number.isFinite(value)) {
    throw new Error('时间戳必须是有效数字。');
  }

  return toResult(unit === 'seconds' ? value * 1000 : value);
}

export function dateToTimestamp(input: string): TimestampResult {
  const source = input.trim();

  if (!source) {
    throw new Error('请输入日期时间。');
  }

  const milliseconds = new Date(source).getTime();

  if (Number.isNaN(milliseconds)) {
    throw new Error('请输入有效的日期时间。');
  }

  return toResult(milliseconds);
}
