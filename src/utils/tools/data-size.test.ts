import { describe, expect, it } from 'vitest';

import {
  convertAllDataSizes,
  convertDataSize,
  formatDataSize,
} from './data-size';

describe('data size tools', () => {
  it('converts between SI and IEC units', () => {
    expect(convertDataSize(1, 'MiB', 'B')).toBe(1_048_576);
    expect(convertDataSize(1, 'MiB', 'MB')).toBe(1.048576);
    expect(convertDataSize(1, 'GB', 'GiB')).toBeCloseTo(0.9313225746);
  });

  it('returns all supported unit values', () => {
    expect(convertAllDataSizes(1_024, 'B')).toMatchObject({
      B: 1_024,
      KB: 1.024,
      KiB: 1,
    });
  });

  it('automatically formats SI and IEC values', () => {
    expect(formatDataSize(1_500, 'B', 'si', 2)).toEqual({
      text: '1.5 KB',
      unit: 'KB',
      value: 1.5,
    });
    expect(formatDataSize(1_536, 'B', 'iec', 1)).toEqual({
      text: '1.5 KiB',
      unit: 'KiB',
      value: 1.5,
    });
  });

  it('rejects negative, unsafe, and invalid precision values', () => {
    expect(() => convertDataSize(-1, 'B', 'KB')).toThrow('非负');
    expect(() => convertDataSize(Number.MAX_SAFE_INTEGER, 'TB', 'B')).toThrow(
      '安全计算范围',
    );
    expect(() => formatDataSize(1, 'B', 'si', 9)).toThrow('0 到 8');
  });
});
