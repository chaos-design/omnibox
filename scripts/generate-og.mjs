import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = path.resolve(import.meta.dirname, '..');

/** 与 src/app/globals.css 的 .dark 主题保持一致 */
const tokens = {
  background: '#101218',
  surface: '#171a21',
  border: '#2c323d',
  borderStrong: '#3b4350',
  primary: '#60a5fa',
  textPrimary: '#f4f7fb',
  textSecondary: '#c4cbd6',
  textTertiary: '#8b95a5',
  brand: '#d81e06',
};

const WIDTH = 1200;
const HEIGHT = 630;
const FONT =
  'PingFang SC, Hiragino Sans GB, Heiti SC, Helvetica Neue, Helvetica, Arial, sans-serif';
const MONO =
  'SF Mono, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace';

const escape = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 按视觉宽度估算文本像素宽度，用于居中与截断判断（CJK 按全宽计）。 */
function measure(text, fontSize, mono = false) {
  let units = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    const wide =
      code >= 0x1100 &&
      (code <= 0x115f ||
        (code >= 0x2e80 && code <= 0xa4cf) ||
        (code >= 0xac00 && code <= 0xd7a3) ||
        (code >= 0xf900 && code <= 0xfaff) ||
        (code >= 0xfe30 && code <= 0xfe6f) ||
        (code >= 0xff00 && code <= 0xff60) ||
        (code >= 0xffe0 && code <= 0xffe6));
    units += mono || wide ? 1 : 0.55;
  }
  return units * fontSize;
}

/** 一行带边框的标签，宽度按文字自适应。 */
function chip(text, x, y, { fontSize = 20, height = 40 } = {}) {
  const width = measure(text, fontSize) + 32;
  return {
    node: `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}"
        fill="${tokens.surface}" stroke="${tokens.border}"/>
      <text x="${x + width / 2}" y="${y + height / 2}" fill="${tokens.textSecondary}"
        font-family="${FONT}" font-size="${fontSize}" text-anchor="middle"
        dominant-baseline="central">${escape(text)}</text>
    </g>`,
    width,
  };
}

function buildSvg(logoDataUri) {
  const groups = ['代码', '数据', 'JavaScript', 'JSON', '文本', '工具箱'];
  const chips = [];
  let cursorX = 80;
  const chipY = 486;
  for (const label of groups) {
    const { node, width } = chip(label, cursorX, chipY);
    chips.push(node);
    cursorX += width + 12;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#141822"/>
      <stop offset="55%" stop-color="${tokens.background}"/>
      <stop offset="100%" stop-color="#0b0d12"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${tokens.primary}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${tokens.primary}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowWarm" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${tokens.brand}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${tokens.brand}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="${tokens.border}" stroke-width="1" opacity="0.32"/>
    </pattern>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${tokens.brand}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${tokens.brand}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
  <ellipse cx="920" cy="90" rx="440" ry="320" fill="url(#glow)"/>
  <ellipse cx="120" cy="600" rx="360" ry="240" fill="url(#glowWarm)"/>

  <g>
    <image x="80" y="70" width="84" height="84" xlink:href="${logoDataUri}"/>
  </g>

  <text x="184" y="118" fill="${tokens.textPrimary}" font-family="${FONT}"
    font-size="54" font-weight="700" letter-spacing="-1.5">Omnibox</text>
  <text x="186" y="152" fill="${tokens.textTertiary}" font-family="${MONO}"
    font-size="19" letter-spacing="0.4">chaos-design.github.io/omnibox</text>

  <rect x="80" y="212" width="88" height="3" rx="1.5" fill="url(#rule)"/>

  <text x="80" y="284" fill="${tokens.textPrimary}" font-family="${FONT}"
    font-size="42" font-weight="600" letter-spacing="-0.5">面向开发者的本地优先工具箱</text>
  <text x="80" y="334" fill="${tokens.textSecondary}" font-family="${FONT}"
    font-size="24">输入内容仅在浏览器内处理，不上传服务端，无需登录</text>

  <g transform="translate(80, 380)">
    <circle cx="6" cy="6" r="6" fill="${tokens.brand}"/>
    <text x="24" y="13" fill="${tokens.textSecondary}" font-family="${FONT}"
      font-size="21">28 个工具 · 6 大分类 · 172 个单元测试</text>
  </g>

  ${chips.join('\n  ')}

  <g transform="translate(80, 556)">
    <rect x="0" y="-13" width="16" height="16" rx="4"
      fill="none" stroke="${tokens.borderStrong}" stroke-width="1.5"/>
    <text x="32" y="1" fill="${tokens.textTertiary}" font-family="${MONO}"
      font-size="17">Cmd/Ctrl + K 唤起全局工具搜索</text>
  </g>
</svg>`;
}

const logo = await readFile(path.join(projectRoot, 'public', 'chaos.png'));
const logoDataUri = `data:image/png;base64,${logo.toString('base64')}`;

const svg = buildSvg(logoDataUri);
await sharp(Buffer.from(svg), { density: 144 })
  .resize(WIDTH, HEIGHT, { fit: 'fill' })
  .png({ compressionLevel: 9, palette: false })
  .toFile(path.join(projectRoot, 'public', 'og.png'));

await writeFile(path.join(projectRoot, 'public', 'og.svg'), `${svg}\n`, 'utf8');

console.log(`已生成 public/og.png 与 public/og.svg（${WIDTH}x${HEIGHT}）`);
