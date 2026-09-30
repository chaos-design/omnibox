import { describe, expect, it } from 'vitest';

import { defaultTheme, isTheme, resolveTheme } from './theme';

describe('theme', () => {
  it('accepts supported themes', () => {
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('light')).toBe(true);
  });

  it('falls back to the dark theme', () => {
    expect(resolveTheme(null)).toBe(defaultTheme);
    expect(resolveTheme('system')).toBe('dark');
  });
});
