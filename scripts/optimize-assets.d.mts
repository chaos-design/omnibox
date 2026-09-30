/**
 * optimize-assets.mjs 的类型声明。
 *
 * tsconfig 开了 allowJs: false（构建脚本不参与打包，没必要让它们进类型检查），
 * 但同目录的 .test.ts 需要引用其中的纯函数，所以在这里手工声明签名。
 */
export function toPrefetch(href: string): string;
export function detectBasePath(html: string): string;
export function injectPrefetch(html: string, loaderHref: string): string;
