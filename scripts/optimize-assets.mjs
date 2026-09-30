import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * 构建后处理：预取 monaco 的 AMD loader。
 *
 * 只做这一件事，因为它是这个产物里唯一"重且非首屏必需"的资源：
 * loader.js 自身只有 40KB，但它后面挂着 3MB 的 editor 包。
 * utils/monaco/loader.ts 的空闲预热要在冷启动时先等这 40KB 往返，
 * 预取掉之后，用户点进第一个编辑器工具时 AMD 已经就绪。
 *
 * 刻意不做「把 CSS 改成异步加载」：
 * 全站 CSS 约 21KB(gz)，拆成 3 个请求并行下载，相比阻塞渲染的代价
 * 可以忽略，换来的是确定的样式闪烁。更关键的是各工具页样式和
 * 加载态样式（components/loading）被打进同一个 chunk，
 * 异步化那个 chunk 就等于让路由过渡的加载指示器先无样式渲染、
 * 再撑满 —— 正是要避免的跳动。实测把该 chunk 判为首屏关键后，
 * 工具页可异步的 CSS 归零，首页也只有 0.8KB(gz)，收益不成比例。
 *
 * JS 侧不需要处理：Next.js 静态导出自带的 <script async> 已经是异步的。
 */

const projectRoot = path.resolve(import.meta.dirname, '..');

/** 缺少任何一个，编辑器都会白屏；在这里失败比在浏览器里白屏好。 */
const REQUIRED_ASSETS = [
  'monaco/vs/loader.js',
  'monaco/vs/editor/editor.main.js',
];

export function toPrefetch(href) {
  return `<link rel="prefetch" as="script" href="${href}" fetchPriority="low"/>`;
}

/** 从产物里反推 basePath（GitHub Pages 部署在 /<repo> 子路径下）。 */
export function detectBasePath(html) {
  const match = html.match(/(?:href|src)="([^"]*?)\/_next\/static\//u);
  return match?.[1] ?? '';
}

/**
 * 幂等注入。产物可能被反复处理（本地 build 多次、CI 重跑），
 * 重复的 prefetch 只会白白占用连接，所以先查后写。
 */
export function injectPrefetch(html, loaderHref) {
  if (html.includes(`href="${loaderHref}"`)) {
    return html;
  }
  if (!html.includes('</head>')) {
    throw new Error('产物里找不到 </head>，无法注入 prefetch。');
  }
  return html.replace('</head>', `${toPrefetch(loaderHref)}</head>`);
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.name.endsWith('.html')) {
      yield full;
    }
  }
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const outDir = path.join(projectRoot, 'out');

  if (!(await exists(outDir))) {
    throw new Error('未找到 out/，请先执行 next build。');
  }

  const missing = [];
  for (const asset of REQUIRED_ASSETS) {
    if (!(await exists(path.join(outDir, asset)))) {
      missing.push(asset);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `产物缺少自托管的 monaco 资源：${missing.join('、')}。` +
        '通常是 pnpm install 的 postinstall 没跑 sync-monaco。',
    );
  }

  let count = 0;
  for await (const file of walk(outDir)) {
    const html = await readFile(file, 'utf8');
    const basePath = detectBasePath(html);
    const next = injectPrefetch(html, `${basePath}/monaco/vs/loader.js`);
    if (next !== html) {
      await writeFile(file, next, 'utf8');
      count += 1;
    }
  }

  console.log(`已为 ${count} 个页面注入 monaco loader.js 的 prefetch。`);
}

// 仅在直接执行时跑构建后处理；被 import 时只导出纯函数供测试。
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}
