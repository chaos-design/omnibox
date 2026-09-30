// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadSvgQRCode, downloadText } from './download';

describe('download tools', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('releases generated object URLs after starting a download', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => 'blob:omnibox');
    const revokeObjectURL = vi.fn();
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectURL },
      revokeObjectURL: { configurable: true, value: revokeObjectURL },
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadText('content', 'result.txt');

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:omnibox');
  });

  it('inlines SVG QR code images before downloading', async () => {
    document.body.innerHTML =
      '<div id="qr"><svg xmlns="http://www.w3.org/2000/svg"><image href="/logo.png"/></svg></div>';
    const downloadedBlobs: Blob[] = [];
    const createObjectURL = vi.fn((blob: Blob) => {
      downloadedBlobs.push(blob);
      return 'blob:qr-code';
    });
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: createObjectURL },
      revokeObjectURL: { configurable: true, value: vi.fn() },
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        blob: async () =>
          new Blob([Uint8Array.from([1, 2, 3])], { type: 'image/png' }),
        ok: true,
      })),
    );

    await downloadSvgQRCode('qr', 'qr.svg');

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(await downloadedBlobs[0].text()).toContain(
      'data:image/png;base64,AQID',
    );
  });
});
