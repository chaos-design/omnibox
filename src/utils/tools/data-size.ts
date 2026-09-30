export type DataSizeUnit =
  | 'B'
  | 'KB'
  | 'MB'
  | 'GB'
  | 'TB'
  | 'KiB'
  | 'MiB'
  | 'GiB'
  | 'TiB';

export type DataSizeSystem = 'si' | 'iec';

export interface FormattedDataSize {
  text: string;
  unit: DataSizeUnit;
  value: number;
}

export const dataSizeUnits: DataSizeUnit[] = [
  'B',
  'KB',
  'MB',
  'GB',
  'TB',
  'KiB',
  'MiB',
  'GiB',
  'TiB',
];

const factors: Record<DataSizeUnit, number> = {
  B: 1,
  KB: 1_000,
  MB: 1_000_000,
  GB: 1_000_000_000,
  TB: 1_000_000_000_000,
  KiB: 1_024,
  MiB: 1_048_576,
  GiB: 1_073_741_824,
  TiB: 1_099_511_627_776,
};

function toBytes(value: number, unit: DataSizeUnit): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('数据大小必须是非负有限数字。');
  }

  const bytes = value * factors[unit];

  if (!Number.isFinite(bytes) || bytes > Number.MAX_SAFE_INTEGER) {
    throw new Error('数据大小超过安全计算范围。');
  }

  return bytes;
}

function validateDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 8) {
    throw new Error('小数位必须是 0 到 8 之间的整数。');
  }
}

export function convertDataSize(
  value: number,
  from: DataSizeUnit,
  to: DataSizeUnit,
): number {
  return toBytes(value, from) / factors[to];
}

export function convertAllDataSizes(
  value: number,
  from: DataSizeUnit,
): Record<DataSizeUnit, number> {
  const bytes = toBytes(value, from);

  return Object.fromEntries(
    dataSizeUnits.map((unit) => [unit, bytes / factors[unit]]),
  ) as Record<DataSizeUnit, number>;
}

export function formatDataSize(
  value: number,
  from: DataSizeUnit,
  system: DataSizeSystem,
  decimals = 2,
): FormattedDataSize {
  validateDecimals(decimals);
  const bytes = toBytes(value, from);
  const units: DataSizeUnit[] =
    system === 'si'
      ? ['B', 'KB', 'MB', 'GB', 'TB']
      : ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let unit = units[0];

  for (const candidate of units) {
    if (bytes >= factors[candidate]) {
      unit = candidate;
    }
  }

  const converted = bytes / factors[unit];
  const rounded = Number(converted.toFixed(decimals));

  return {
    text: `${rounded} ${unit}`,
    unit,
    value: rounded,
  };
}
