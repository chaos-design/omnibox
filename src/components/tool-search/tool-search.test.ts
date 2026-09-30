import { describe, expect, it } from 'vitest';

import { isToolSearchShortcut } from './tool-search';

const baseEvent = {
  altKey: false,
  ctrlKey: false,
  key: 'k',
  metaKey: false,
  repeat: false,
};

describe('tool search shortcut', () => {
  it('accepts Command K and Control K case-insensitively', () => {
    expect(isToolSearchShortcut({ ...baseEvent, metaKey: true })).toBe(true);
    expect(
      isToolSearchShortcut({ ...baseEvent, ctrlKey: true, key: 'K' }),
    ).toBe(true);
  });

  it('rejects unrelated, repeated, and Alt-modified shortcuts', () => {
    expect(isToolSearchShortcut(baseEvent)).toBe(false);
    expect(
      isToolSearchShortcut({ ...baseEvent, metaKey: true, key: 'p' }),
    ).toBe(false);
    expect(
      isToolSearchShortcut({ ...baseEvent, metaKey: true, repeat: true }),
    ).toBe(false);
    expect(
      isToolSearchShortcut({
        ...baseEvent,
        altKey: true,
        metaKey: true,
      }),
    ).toBe(false);
  });
});
