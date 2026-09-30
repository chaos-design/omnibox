import { describe, expect, it } from 'vitest';

import {
  dateToTimestamp,
  formatDateTimeLocalInput,
  timestampToDate,
} from './timestamp';

describe('timestamp tools', () => {
  it('converts second and millisecond timestamps to dates', () => {
    expect(timestampToDate('1.5', 'seconds')).toMatchObject({
      iso: '1970-01-01T00:00:01.500Z',
      milliseconds: '1500',
      seconds: '1.5',
    });
    expect(timestampToDate('1500', 'milliseconds').iso).toBe(
      '1970-01-01T00:00:01.500Z',
    );
  });

  it('converts ISO dates to both timestamp units', () => {
    expect(dateToTimestamp('1970-01-01T00:00:01.500Z')).toMatchObject({
      milliseconds: '1500',
      seconds: '1.5',
    });
  });

  it('normalizes fractional milliseconds consistently across result fields', () => {
    expect(timestampToDate('1.9', 'milliseconds')).toMatchObject({
      iso: '1970-01-01T00:00:00.001Z',
      milliseconds: '1',
      seconds: '0.001',
    });
  });

  it('formats values accepted by datetime-local inputs', () => {
    const date = new Date(2026, 7, 1, 9, 5, 7);

    expect(formatDateTimeLocalInput(date)).toBe('2026-08-01T09:05:07');
  });

  it('rejects missing, invalid, and out-of-range values', () => {
    expect(() => timestampToDate('', 'seconds')).toThrow('请输入时间戳');
    expect(() => timestampToDate('abc', 'seconds')).toThrow('有效数字');
    expect(() => timestampToDate('9e30', 'milliseconds')).toThrow('范围');
    expect(() => dateToTimestamp('not-a-date')).toThrow('有效的日期时间');
  });
});
