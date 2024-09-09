import { message } from 'antd';

export const copyToClipboard = (
  text: string,
  feedback = () => message.success('复制成功'),
) => {
  const input = document.createElement('input');

  input.setAttribute('readonly', 'readonly');
  input.setAttribute('value', text);
  document.body.appendChild(input);
  input.setSelectionRange(0, 9999);
  input.select();

  input.setSelectionRange(0, input.value.length);
  document.execCommand('copy');

  document.body.removeChild(input);

  if (typeof feedback === 'function') {
    feedback();
  }
};
