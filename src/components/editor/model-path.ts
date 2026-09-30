/**
 * model 缓存槽位的 path。
 *
 * @monaco-editor/react 内部是 `getModel(Uri.parse(path)) ?? createModel(...)`：
 * 给了稳定的 path，切换工具再回来就会命中同一个 model —— 不重新分词、
 * 不丢撤销栈、不丢光标与折叠状态，编辑器是「接着用」而不是「重新加载」。
 * 默认 keepCurrentModel=false 会在卸载时 dispose 掉 model，所以必须同时打开
 * （见 editor.tsx）。
 *
 * key 里带 pathname：不同工具即使调用点写法相同也不会撞车。
 * 纯函数，单独成文件是为了能脱离 React 和 monaco 直接测。
 */
export function modelPath(pathname: string, slot: number | string) {
  const route = pathname === '/' ? 'root' : pathname.replace(/^\/+|\/+$/gu, '');
  return `inmemory://omnibox/${encodeURIComponent(route)}/${slot}`;
}
