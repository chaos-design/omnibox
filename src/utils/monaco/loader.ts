import { loader } from '@monaco-editor/react';

// 自托管 monaco：资源由 scripts/sync-monaco.mjs 从 node_modules 复制到 public/monaco。
// 走 CDN 会在弱网下长时间白屏，且加载版本与依赖版本不一致。
// 这个 config 必须在 loader.init() 之前跑，所以放在共享模块的顶层：
// app-shell（预热）与 components/editor（真正使用）都会导入本模块，
// 任何一条路径都会先把自托管 paths 注册好。
const monacoBasePath = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/monaco/vs`;

if (typeof window !== 'undefined') {
  loader.config({ paths: { vs: monacoBasePath } });
}

let preloading = false;
let preloaded = false;

/**
 * 空闲时预热 monaco 运行时。
 *
 * 重复加载编辑器有两个独立成本，这里和 components/editor 各解决一个：
 * 1. AMD 产物（~3MB）—— loader 只在首次 init 时下载。这里提前到空闲时段，
 *    用户点进编辑器工具时通常已经就绪。
 * 2. createModel 的整篇重新分词 —— 靠 <Editor> 传稳定的 path + keepCurrentModel
 *    复用同一个 model 解决，见 components/editor/editor.tsx 的 pathOf 注释。
 */
export function preloadMonaco() {
  if (preloading || preloaded || typeof window === 'undefined') {
    return;
  }
  preloading = true;

  const warm = () => {
    if (preloaded) {
      return;
    }
    preloaded = true;
    // 失败不提示：真正用到编辑器时 loader 会重试，
    // 错误由 <Editor> 的错误边界/日志承担，预热失败不该打扰用户。
    void loader.init().catch(() => undefined);
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(warm, { timeout: 2000 });
  } else {
    setTimeout(warm, 1200);
  }
}
