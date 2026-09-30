function copyTextFallback(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (!document.execCommand('copy')) {
      throw new Error('浏览器拒绝了复制操作。');
    }
  } finally {
    textarea.remove();
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    throw new Error('没有可复制的内容。');
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  copyTextFallback(text);
}
