export interface RgbColor {
  b: number;
  g: number;
  r: number;
}

export interface HslColor {
  h: number;
  l: number;
  s: number;
}

export interface ParsedColor {
  hex: string;
  hsl: HslColor;
  rgb: RgbColor;
}

export interface ContrastResult {
  largeAA: boolean;
  largeAAA: boolean;
  normalAA: boolean;
  normalAAA: boolean;
  ratio: number;
}

function assertRange(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} 必须在 ${minimum} 到 ${maximum} 之间。`);
  }
}

function rgbToHex(rgb: RgbColor): string {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((value) => Math.round(value).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function rgbToHsl(rgb: RgbColor): HslColor {
  const red = rgb.r / 255;
  const green = rgb.g / 255;
  const blue = rgb.b / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  let hue = 0;

  if (delta !== 0) {
    if (maximum === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (maximum === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return {
    h: Number(hue.toFixed(2)),
    s: Number((saturation * 100).toFixed(2)),
    l: Number((lightness * 100).toFixed(2)),
  };
}

function hslToRgb(hsl: HslColor): RgbColor {
  const saturation = hsl.s / 100;
  const lightness = hsl.l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const section = hsl.h / 60;
  const secondary = chroma * (1 - Math.abs((section % 2) - 1));
  const offset = lightness - chroma / 2;
  let channels: [number, number, number];

  if (section < 1) {
    channels = [chroma, secondary, 0];
  } else if (section < 2) {
    channels = [secondary, chroma, 0];
  } else if (section < 3) {
    channels = [0, chroma, secondary];
  } else if (section < 4) {
    channels = [0, secondary, chroma];
  } else if (section < 5) {
    channels = [secondary, 0, chroma];
  } else {
    channels = [chroma, 0, secondary];
  }

  return {
    r: Math.round((channels[0] + offset) * 255),
    g: Math.round((channels[1] + offset) * 255),
    b: Math.round((channels[2] + offset) * 255),
  };
}

function parseHex(input: string): RgbColor | null {
  const match = /^#([\dA-Fa-f]{3}|[\dA-Fa-f]{6})$/u.exec(input);

  if (!match) {
    return null;
  }

  const source =
    match[1].length === 3
      ? Array.from(match[1], (character) => character.repeat(2)).join('')
      : match[1];

  return {
    r: Number.parseInt(source.slice(0, 2), 16),
    g: Number.parseInt(source.slice(2, 4), 16),
    b: Number.parseInt(source.slice(4, 6), 16),
  };
}

function parseRgb(input: string): RgbColor | null {
  const match =
    /^rgb\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/iu.exec(input);

  if (!match) {
    return null;
  }

  const values = match.slice(1).map(Number);
  values.forEach((value) => assertRange(value, 0, 255, 'RGB 通道'));

  return {
    r: Math.round(values[0]),
    g: Math.round(values[1]),
    b: Math.round(values[2]),
  };
}

function parseHsl(input: string): RgbColor | null {
  const match =
    /^hsl\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)%\s*,\s*(-?[\d.]+)%\s*\)$/iu.exec(
      input,
    );

  if (!match) {
    return null;
  }

  const [hue, saturation, lightness] = match.slice(1).map(Number);
  assertRange(hue, 0, 360, 'HSL 色相');
  assertRange(saturation, 0, 100, 'HSL 饱和度');
  assertRange(lightness, 0, 100, 'HSL 亮度');

  return hslToRgb({
    h: hue === 360 ? 0 : hue,
    s: saturation,
    l: lightness,
  });
}

export function parseColor(input: string): ParsedColor {
  const source = input.trim();

  if (
    /^(?:rgba|hsla)\(/iu.test(source) ||
    /^(?:#[\dA-Fa-f]{4}|#[\dA-Fa-f]{8})$/u.test(source)
  ) {
    throw new Error('暂不支持带透明度的颜色。');
  }

  const rgb = parseHex(source) ?? parseRgb(source) ?? parseHsl(source);

  if (!rgb) {
    throw new Error('请输入有效的 HEX、rgb() 或 hsl() 颜色。');
  }

  return {
    hex: rgbToHex(rgb),
    hsl: rgbToHsl(rgb),
    rgb,
  };
}

function channelLuminance(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb: RgbColor): number {
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

export function getColorContrast(
  foreground: string,
  background: string,
): ContrastResult {
  const foregroundLuminance = relativeLuminance(parseColor(foreground).rgb);
  const backgroundLuminance = relativeLuminance(parseColor(background).rgb);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5,
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    ratio: Number(ratio.toFixed(2)),
  };
}
