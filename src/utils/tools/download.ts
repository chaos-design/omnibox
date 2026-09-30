export function download(url: string, fileName: string) {
  const anchor = document.createElement('a');
  anchor.download = fileName;
  anchor.href = url;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function downloadObjectUrl(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);

  try {
    download(url, fileName);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export function downloadCanvas(
  canvas: HTMLCanvasElement,
  fileName = 'download.png',
) {
  if (!canvas) {
    return;
  }

  const url = canvas.toDataURL();
  download(url, fileName);
}

export function downloadSVG(svg: SVGElement, fileName = 'download.svg') {
  if (!svg) {
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  downloadObjectUrl(blob, fileName);
}

export function downloadText(text: string, fileName = 'download.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadObjectUrl(blob, fileName);
}

export function downloadBlob(blob: Blob, fileName: string) {
  downloadObjectUrl(blob, fileName);
}

export const downloadCanvasQRCode = (
  elementId: string,
  fileName = 'QRCode.png',
) => {
  if (!elementId) {
    return;
  }

  const canvas = document
    .getElementById(elementId)
    ?.querySelector<HTMLCanvasElement>('canvas');

  if (canvas) {
    const url = canvas.toDataURL();
    download(url, fileName);
  }
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

async function inlineSvgImages(svg: SVGElement): Promise<SVGElement> {
  const clone = svg.cloneNode(true) as SVGElement;
  const images = Array.from(clone.querySelectorAll('image'));

  await Promise.all(
    images.map(async (image) => {
      const href =
        image.getAttribute('href') ??
        image.getAttributeNS('http://www.w3.org/1999/xlink', 'href');

      if (!href || href.startsWith('data:')) {
        return;
      }

      const response = await fetch(href);

      if (!response.ok) {
        throw new Error(`二维码徽标加载失败：HTTP ${response.status}`);
      }

      image.setAttribute('href', await blobToDataUrl(await response.blob()));
      image.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
    }),
  );

  return clone;
}

export const downloadSvgQRCode = async (
  elementId: string,
  fileName = 'QRCode.svg',
): Promise<void> => {
  if (!elementId) {
    return;
  }

  const svg = document
    .getElementById(elementId)
    ?.querySelector<SVGElement>('svg');

  if (svg) {
    const svgData = new XMLSerializer().serializeToString(
      await inlineSvgImages(svg),
    );
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    downloadObjectUrl(blob, fileName);
  }
};
