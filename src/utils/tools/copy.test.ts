// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyToClipboard } from './copy';

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await copyToClipboard('Omnibox');

    expect(writeText).toHaveBeenCalledWith('Omnibox');
  });

  it('rejects empty content', async () => {
    await expect(copyToClipboard('')).rejects.toThrow('没有可复制的内容');
  });
});
