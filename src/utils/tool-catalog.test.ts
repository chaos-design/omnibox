import { describe, expect, it } from 'vitest';

import { MENU_INFO, menu } from './menu';
import { toolCatalog, toolGroups } from './tool-catalog';

describe('tool catalog', () => {
  it('contains unique paths and searchable metadata', () => {
    const paths = toolCatalog.map((tool) => tool.href);

    expect(toolCatalog).toHaveLength(28);
    expect(new Set(paths).size).toBe(paths.length);
    expect(
      toolCatalog.every(
        (tool) =>
          tool.title &&
          tool.description &&
          tool.keywords.length > 0 &&
          tool.href.startsWith('/'),
      ),
    ).toBe(true);
  });

  it('covers every sidebar tool route', () => {
    const menuPaths = menu
      .flatMap((item) =>
        item.path
          ? [item.path]
          : (item.children?.flatMap((child) => child.path ?? []) ?? []),
      )
      .filter((path) => path !== '/');
    const catalogPaths = new Set(toolCatalog.map((tool) => tool.href));

    expect(menuPaths).toHaveLength(toolCatalog.length);
    expect(menuPaths.every((path) => catalogPaths.has(path))).toBe(true);
  });

  it('uses only declared groups and covers each group', () => {
    const groupKeys = new Set(toolGroups.map((group) => group.key));
    const usedGroups = new Set(toolCatalog.map((tool) => tool.group));

    expect(toolCatalog.every((tool) => groupKeys.has(tool.group))).toBe(true);
    expect(usedGroups).toEqual(groupKeys);
  });

  it('gives every tool a display name instead of falling back to its slug', () => {
    // 缺少 MENU_INFO 条目时侧边栏会直接显示 kebab-case 目录名，
    // 例如 "sse-preview" 而不是 "SSE Preview"。
    const toolSlugs = new Set(
      toolCatalog.map((tool) => tool.href.trim().split('/').at(-1) ?? ''),
    );
    const missing = [...toolSlugs].filter((slug) => !(slug in MENU_INFO));

    expect(missing).toEqual([]);
  });

  it('keeps sidebar labels aligned with catalog titles', () => {
    // 侧边栏与全局搜索是同一个工具的两个入口，名字不一致会让用户以为是两个功能。
    const titles = new Map(
      toolCatalog.map((tool) => [
        tool.href.trim().split('/').at(-1),
        tool.title,
      ]),
    );
    // 历史遗留：这些项的侧边栏用了更简短的别名，暂不强制统一。
    const aliases = new Set(['stringify-parse', 'to-schema', 'codec']);
    // menu 的 child.label 是目录名（diff / format），侧边栏实际渲染的是
    // MENU_INFO[slug].label，比对必须取后者，否则每项都会被误判为不一致。
    const mismatched = menu
      .flatMap((item) => item.children ?? [])
      .flatMap((child) => {
        const slug = child.path?.trim().split('/').at(-1);
        const title = slug === undefined ? undefined : titles.get(slug);

        if (title === undefined || slug === undefined || aliases.has(slug)) {
          return [];
        }

        const display = MENU_INFO[slug]?.label ?? slug;
        return display !== title ? [`${slug}: ${display} != ${title}`] : [];
      });

    expect(mismatched).toEqual([]);
  });
});
