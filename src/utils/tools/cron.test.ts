import { describe, expect, it } from 'vitest';

import { buildCron, parseCron } from './cron';

describe('Cron tools', () => {
  it('recognizes common five-field presets', () => {
    expect(parseCron('* * * * *').summary).toBe('每分钟执行');
    expect(parseCron('0 0 * * 1').summary).toBe('每周一 00:00 执行');
  });

  it('validates lists, ranges, and steps', () => {
    const result = parseCron('*/15 9-18 1,15 * 1-5');

    expect(result.fields[0].description).toContain('每隔 15 分钟');
    expect(result.fields[1].description).toBe('9 到 18 小时');
    expect(result.fields[2].description).toBe('1 日；15 日');
    expect(result.fields[4].description).toBe('1 到 5 星期');
  });

  it('builds an expression from separate fields', () => {
    expect(
      buildCron({
        minute: '30',
        hour: '8',
        dayOfMonth: '*',
        month: '*',
        dayOfWeek: '1-5',
      }).expression,
    ).toBe('30 8 * * 1-5');
  });

  it('rejects malformed field counts and values', () => {
    expect(() => parseCron('* * * *')).toThrow('五个字段');
    expect(() => parseCron('60 * * * *')).toThrow('0 到 59');
    expect(() => parseCron('* 18-9 * * *')).toThrow('起始值');
    expect(() => parseCron('*/0 * * * *')).toThrow('1 到 60');
    expect(() => parseCron('1,,2 * * * *')).toThrow('空项');
    expect(() => parseCron('? * * * *')).toThrow('非法值');
  });
});
