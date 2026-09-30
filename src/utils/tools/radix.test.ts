import { describe, expect, it } from 'vitest';

import { convertRadix } from './radix';

describe('radix tools', () => {
  it('converts values across common integer radices', () => {
    expect(convertRadix('0xFF', 16)).toEqual({
      binary: '11111111',
      octal: '377',
      decimal: '255',
      hexadecimal: 'FF',
    });
    expect(convertRadix('-0b1010', 2).decimal).toBe('-10');
  });

  it('preserves integers beyond Number safe range', () => {
    expect(convertRadix('900719925474099312345', 10).hexadecimal).toBe(
      '30D40000000001B6D9',
    );
  });

  it('rejects decimals, mismatched prefixes, and invalid digits', () => {
    expect(() => convertRadix('1.5', 10)).toThrow('仅支持整数');
    expect(() => convertRadix('0x10', 10)).toThrow('不一致');
    expect(() => convertRadix('102', 2)).toThrow('不属于 2 进制');
    expect(() => convertRadix('', 10)).toThrow('请输入');
  });
});
