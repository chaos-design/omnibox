import { describe, expect, it } from 'vitest';

import { menu } from './menu';
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
});
