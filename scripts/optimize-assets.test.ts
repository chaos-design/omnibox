import { describe, expect, it } from 'vitest';

import {
  detectBasePath,
  injectPrefetch,
  toPrefetch,
} from './optimize-assets.mjs';

describe('detectBasePath', () => {
  it('根部署时为空串', () => {
    expect(
      detectBasePath(
        '<link href="/_next/static/chunks/a.css" rel="stylesheet"/>',
      ),
    ).toBe('');
  });

  it('GitHub Pages 子路径部署时取出仓库名前缀', () => {
    expect(
      detectBasePath('<link href="/omnibox/_next/static/chunks/a.css"/>'),
    ).toBe('/omnibox');
  });

  it('认不出时退回空串，不猜', () => {
    expect(detectBasePath('<html></html>')).toBe('');
  });
});

describe('toPrefetch', () => {
  it('声明为 script —— monaco loader 是 JS，不是样式', () => {
    const html = toPrefetch('/monaco/vs/loader.js');
    expect(html).toContain('rel="prefetch"');
    expect(html).toContain('as="script"');
    expect(html).not.toContain('as="style"');
  });

  it('低优先级，避免和首屏资源抢带宽', () => {
    expect(toPrefetch('/monaco/vs/loader.js')).toContain('fetchPriority="low"');
  });

  it('用 href 而不是 xlink，prefetch 只认 href', () => {
    expect(toPrefetch('/monaco/vs/loader.js')).toContain(
      'href="/monaco/vs/loader.js"',
    );
  });
});

describe('injectPrefetch', () => {
  it('注入到 head 末尾', () => {
    const next = injectPrefetch(
      '<html><head><title>x</title></head><body></body></html>',
      '/monaco/vs/loader.js',
    );
    expect(next).toBe(
      '<html><head><title>x</title>' +
        '<link rel="prefetch" as="script" href="/monaco/vs/loader.js" fetchPriority="low"/>' +
        '</head><body></body></html>',
    );
  });

  it('幂等：重复处理不会堆叠 prefetch', () => {
    const once = injectPrefetch('<head></head>', '/monaco/vs/loader.js');
    const twice = injectPrefetch(once, '/monaco/vs/loader.js');
    expect(twice).toBe(once);
    expect(twice.match(/rel="prefetch"/gu)).toHaveLength(1);
  });

  it('不覆盖已存在的阻塞样式表', () => {
    const html =
      '<head><link rel="stylesheet" href="/_next/static/chunks/a.css"/></head>';
    expect(injectPrefetch(html, '/m.js')).toContain(
      '<link rel="stylesheet" href="/_next/static/chunks/a.css"/>',
    );
  });

  it('缺 head 时报错，不静默跳过', () => {
    expect(() => injectPrefetch('<html><body></body></html>', '/m.js')).toThrow(
      /<\/head>/u,
    );
  });
});
