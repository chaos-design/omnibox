import { describe, expect, it } from 'vitest';

import { getColorContrast, parseColor } from './color';

describe('color tools', () => {
  it('normalizes short and full HEX colors', () => {
    expect(parseColor('#0af')).toEqual({
      hex: '#00AAFF',
      hsl: { h: 200, s: 100, l: 50 },
      rgb: { r: 0, g: 170, b: 255 },
    });
    expect(parseColor('#ffffff').hex).toBe('#FFFFFF');
  });

  it('converts RGB and HSL inputs', () => {
    expect(parseColor('rgb(255, 0, 0)')).toMatchObject({
      hex: '#FF0000',
      hsl: { h: 0, s: 100, l: 50 },
    });
    expect(parseColor('hsl(120, 100%, 25%)')).toMatchObject({
      hex: '#008000',
      rgb: { r: 0, g: 128, b: 0 },
    });
  });

  it('calculates WCAG contrast thresholds', () => {
    expect(getColorContrast('#000', '#fff')).toEqual({
      largeAA: true,
      largeAAA: true,
      normalAA: true,
      normalAAA: true,
      ratio: 21,
    });
    expect(getColorContrast('#777', '#fff')).toMatchObject({
      largeAA: true,
      normalAA: false,
    });
  });

  it('rejects transparent, out-of-range, and malformed colors', () => {
    expect(() => parseColor('#ffffff80')).toThrow('透明度');
    expect(() => parseColor('rgba(0, 0, 0, 0.5)')).toThrow('透明度');
    expect(() => parseColor('rgb(256, 0, 0)')).toThrow('0 到 255');
    expect(() => parseColor('hsl(0, 120%, 50%)')).toThrow('0 到 100');
    expect(() => parseColor('red')).toThrow('有效的');
  });
});
