import { describe, expect, it } from 'vitest';

import { modelPath } from './model-path';

/**
 * path 是 model 复用的唯一依据（@monaco-editor/react 内部
 * `getModel(Uri.parse(path)) ?? createModel(...)`）。
 * 一旦两个编辑器算出同一个 path，它们会共享同一个 model：
 * 内容互相覆盖、撤销栈串台。反过来 path 每次都变，缓存等于没有。
 */
describe('modelPath', () => {
  it('同一路由同一槽位恒定 —— 这是复用的前提', () => {
    expect(modelPath('/json/stringify-parse', 0)).toBe(
      modelPath('/json/stringify-parse', 0),
    );
  });

  it('不同路由不撞车', () => {
    expect(modelPath('/code/format', 0)).not.toBe(
      modelPath('/json/stringify-parse', 0),
    );
  });

  it('同路由不同槽位不撞车', () => {
    expect(modelPath('/json/stringify-parse', 'input')).not.toBe(
      modelPath('/json/stringify-parse', 'output'),
    );
  });

  it('首页与子路由不撞车', () => {
    expect(modelPath('/', 0)).not.toBe(modelPath('/code/format', 0));
  });

  it('忽略首尾斜杠，/a 与 /a/ 是同一个工具', () => {
    expect(modelPath('/code/format/', 0)).toBe(modelPath('/code/format', 0));
  });

  it('槽位里的斜杠不会造出额外的路径层级', () => {
    // sse-preview 的 code/${type} 槽位含有斜杠。
    // encodeURIComponent 只编码 route，槽位原样拼在后面，
    // 所以 code/curl 与 code/node 仍然是两个不同的 uri。
    expect(modelPath('/kits/sse-preview', 'code/curl')).not.toBe(
      modelPath('/kits/sse-preview', 'code/node'),
    );
  });

  it('是 monaco.Uri.parse 能吃的绝对 URI', () => {
    expect(modelPath('/code/format', 0)).toBe(
      'inmemory://omnibox/code%2Fformat/0',
    );
    expect(modelPath('/', 0)).toBe('inmemory://omnibox/root/0');
  });

  it('不含会截断 uri 的字符', () => {
    for (const path of [
      modelPath('/a', 0),
      modelPath('/kits/sse-preview', 'code/curl'),
      modelPath('/', 'input'),
    ]) {
      expect(path).not.toMatch(/[?#]/u);
    }
  });
});
