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

/** 正六边形顶点（尖角朝上），比梯形更像能量核心而非容器。 */
function hexagon(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 90);
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(
      cy + r * Math.sin(angle)
    ).toFixed(1)}`;
  }).join(' ');
}

/**
 * 主视觉：代码字符带残影落入六边形能量核心。
 * 越靠近核心越亮，边缘处被「吸收」——对应工具汇聚进同一个盒子。
 */
function coreVisual() {
  // 上移并内收：外环 188 + 中心偏移后仍需与画布边距保持 30px 以上。
  const cx = 866;
  const cy = 424;
  const core = 120;
  const r1 = 146;
  const r2 = 176;

  // 下落中的字符：echo 为残影层数，op 随接近核心升高。
  const falling = [
    { g: '.*', x: 728, y: 216, op: 0.36, size: 25, echo: 3 },
    { g: '</>', x: 790, y: 180, op: 0.42, size: 27, echo: 3 },
    { g: '{ }', x: 856, y: 222, op: 0.5, size: 31, echo: 3 },
    { g: '#', x: 924, y: 186, op: 0.46, size: 33, echo: 3 },
    { g: '01', x: 988, y: 220, op: 0.38, size: 25, echo: 3 },
  ];

  // 已被核心收录的字符。
  const absorbed = [
    { g: '=', x: 834, y: 394, op: 0.4, size: 24 },
    { g: '>', x: 798, y: 434, op: 0.72, size: 28 },
    { g: '+', x: 884, y: 470, op: 0.88, size: 31 },
    { g: '|', x: 942, y: 424, op: 0.58, size: 26 },
    { g: '<', x: 852, y: 502, op: 0.44, size: 26 },
  ];

  // 残影：同一字符向上叠印若干层，透明度递减，模拟高速下落。
  const echoText = (item) => {
    const layers = Array.from({ length: item.echo }, (_, i) => {
      const step = i + 1;
      return `      <text x="${item.x}" y="${item.y - step * 17}" fill="${tokens.primary}"
        font-family="${MONO}" font-size="${item.size}" text-anchor="middle"
        dominant-baseline="central" opacity="${(item.op * 0.3) / step}">${escape(item.g)}</text>`;
    });

    return layers.join('\n');
  };

  const text = (item) =>
    `    <text x="${item.x}" y="${item.y}" fill="${tokens.primary}"
      font-family="${MONO}" font-size="${item.size}" text-anchor="middle"
      dominant-baseline="central" opacity="${item.op}">${escape(item.g)}</text>`;

  // 正在穿过核心上沿的一枚，静止画面里速度感的主要来源。
  const crossing = `    <text x="866" y="300" fill="${tokens.textPrimary}"
      font-family="${MONO}" font-size="32" text-anchor="middle"
      dominant-baseline="central" opacity="0.95">{}</text>`;

  return {
    glow: `<ellipse cx="${cx}" cy="${cy}" rx="280" ry="235" fill="url(#coreGlow)"/>`,
    rings: [
      `    <polygon points="${hexagon(cx, cy, r2)}" fill="none"
        stroke="${tokens.primary}" stroke-width="1" opacity="0.16" stroke-dasharray="7 11"/>`,
      `    <polygon points="${hexagon(cx, cy, r1)}" fill="none"
        stroke="${tokens.primary}" stroke-width="1.5" opacity="0.32"/>`,
    ].join('\n'),
    core: `    <polygon points="${hexagon(cx, cy, core)}" fill="url(#coreFill)"
      stroke="${tokens.primary}" stroke-width="2.5" stroke-linejoin="round"/>`,
    // 内圈装饰：细线连成网格，暗示「工具已被编目」。
    mesh: `    <g stroke="${tokens.primary}" stroke-width="1" opacity="0.14">
      <line x1="${cx - 60}" y1="${cy - 30}" x2="${cx + 60}" y2="${cy - 30}"/>
      <line x1="${cx - 73}" y1="${cy + 18}" x2="${cx + 73}" y2="${cy + 18}"/>
      <line x1="${cx - 43}" y1="${cy + 64}" x2="${cx + 43}" y2="${cy + 64}"/>
    </g>`,
    echoes: falling.map(echoText).join('\n'),
    falling: falling.map(text).join('\n'),
    absorbed: absorbed.map(text).join('\n'),
    crossing,
  };
}

/** 左下角的电路走线，填补去掉标签后的留白，同时强化科技基调。 */
function circuitTraces() {
  const paths = [
    'M 80 520 L 188 520 L 214 546 L 322 546',
    'M 80 470 L 156 470 L 182 444 L 268 444',
    'M 80 566 L 214 566 L 240 592 L 336 592',
  ];
  const vias = [
    [214, 546],
    [182, 444],
    [240, 592],
  ];

  // 压得比主视觉低一档：走线是背景肌理，不该与六边形争夺注意力。
  const lines = paths
    .map(
      (d) =>
        `    <path d="${d}" fill="none" stroke="${tokens.borderStrong}"
      stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.32"/>`,
    )
    .join('\n');
  const dots = vias
    .map(
      ([x, y]) =>
        `    <circle cx="${x}" cy="${y}" r="3" fill="${tokens.primary}" opacity="0.32"/>`,
    )
    .join('\n');

  return `${lines}\n${dots}`;
}

/** 四角 HUD 括号，框住画面。 */
function hudFrame() {
  const size = 26;
  const inset = 26;
  const corners = [
    [inset, inset, 1, 1],
    [WIDTH - inset, inset, -1, 1],
    [inset, HEIGHT - inset, 1, -1],
    [WIDTH - inset, HEIGHT - inset, -1, -1],
  ];

  return corners
    .map(([x, y, sx, sy]) => {
      const x2 = x + size * sx;
      const y2 = y + size * sy;

      return `    <path d="M ${x2} ${y} L ${x} ${y} L ${x} ${y2}" fill="none"
      stroke="${tokens.primary}" stroke-width="2" stroke-linecap="round" opacity="0.45"/>`;
    })
    .join('\n');
}

function buildSvg(logoDataUri) {
  const core = coreVisual();
  const traces = circuitTraces();
  const hud = hudFrame();

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
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#ffffff" opacity="0.025"/>
    </pattern>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${tokens.brand}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${tokens.brand}" stop-opacity="0"/>
    </linearGradient>
    <!-- userSpaceOnUse：核心区固定在 (866,424)，绝对坐标才能对齐六边形。 -->
    <linearGradient id="coreFill" x1="0" y1="304" x2="0" y2="544" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1e2431"/>
      <stop offset="100%" stop-color="#10131a"/>
    </linearGradient>
    <radialGradient id="coreGlow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${tokens.primary}" stop-opacity="0.3"/>
      <stop offset="70%" stop-color="${tokens.primary}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${tokens.primary}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lip" x1="700" y1="0" x2="1080" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${tokens.primary}" stop-opacity="0.2"/>
      <stop offset="50%" stop-color="${tokens.primary}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${tokens.primary}" stop-opacity="0.2"/>
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

  <g>
    ${core.glow}
${core.rings}
${core.core}
${core.mesh}
${core.absorbed}
${core.crossing}
${core.echoes}
${core.falling}
  </g>

  <g>
${traces}
  </g>

  <g>
${hud}
  </g>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#scan)" pointer-events="none"/>
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
