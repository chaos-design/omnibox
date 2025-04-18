export function download(url: string, fileName: string) {
  const a = document.createElement('a');
  a.download = fileName;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
  const url = URL.createObjectURL(blob);
  download(url, fileName);
}

export function downloadText(text: string, fileName = 'download.txt') {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  download(url, fileName);
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  download(url, fileName);
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

export const downloadSvgQRCode = (
  elementId: string,
  fileName = 'QRCode.svg',
) => {
  if (!elementId) {
    return;
  }

  const svg = document
    .getElementById(elementId)
    ?.querySelector<SVGElement>('svg');

  if (svg) {
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    download(url, fileName);
  }
};
