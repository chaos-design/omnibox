/**
 * 对 JSON 内容进行转义处理
 * @param input 待转义的 JSON 内容
 * @returns 转义后的 JSON 内容
 */
export function escapeJSON(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');
  return input.replace(/[\\"'\x00-\x1F\x7F-\x9F]/g, (character) => {
    switch (character) {
      case '\\':
        return '\\\\';
      case '"':
        return '\\"';
      case "'":
        return "\\'";
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '\t':
        return '\\t';
      case '\b':
        return '\\b';
      case '\f':
        return '\\f';
      default:
        return '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0');
    }
  });
}

/**
 * 对转义的 JSON 内容进行去转义处理
 * @param input 待去转义的 JSON 内容
 * @returns 去转义后的 JSON 内容
 */
export function unescapeJSON(input: string): string {
  return input.replace(/\\\\/g, '\\').replace(/\\\"/g, '"');
  return input.replace(
    /\\(\\|\/|"|'|n|r|t|b|f|u[0-9a-fA-F]{4})/g,
    (match, esc) => {
      switch (esc) {
        case '\\':
          return '\\';
        case '/':
          return '/';
        case '"':
          return '"';
        case "'":
          return "'";
        case 'n':
          return '\n';
        case 'r':
          return '\r';
        case 't':
          return '\t';
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        default:
          return String.fromCharCode(parseInt(esc.slice(1), 16));
      }
    },
  );
}

/**
 * 压缩 JSON 字符串，移除所有的空格和换行符
 * @param input 待压缩的 JSON 字符串
 * @returns 压缩后的 JSON 字符串
 */
export function compressJSON(input: string): string {
  return input.replace(/\s+/g, '');
}

/**
 * 压缩并转义 JSON 字符串
 * @param input 待处理的 JSON 字符串
 * @returns 压缩并转义后的 JSON 字符串
 */
export function compressAndEscapeJSON(input: string): string {
  const compressed = compressJSON(input);
  return escapeJSON(compressed);
}

/**
 * Unicode 转中文
 * @param input Unicode 字符串
 * @returns 中文字符串
 */
export function unicodeToChinese(input: string): string {
  return input.replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
    return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
  });
}

/**
 * 中文转 Unicode
 * @param input 中文字符串
 * @returns Unicode 字符串
 */
export function chineseToUnicode(input: string): string {
  return input
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0).toString(16).toUpperCase();
      return '\\u' + '0000'.substring(0, 4 - code.length) + code;
    })
    .join('');
}

/**
 * 中文符号转英文符号
 * @param input 中文符号字符串
 * @returns 英文符号字符串
 */
export function chinesePunctuationToEnglish(
  input: string,
  escape = false,
): string {
  const punctuationMap: { [key: string]: string } = {
    '，': ',',
    '。': '.',
    '！': '!',
    '？': '?',
    '：': ':',
    '；': ';',
    '“': escape ? '\\\"' : '"',
    '”': escape ? '\\\"' : '"',
    '‘': escape ? '\\\'' : "'",
    '’': escape ? '\\\'' : "'",
    '（': escape ? '\\\(' : '(',
    '）': escape ? '\\\)' : ')',
    '【': escape ? '\\\[' : '[',
    '】': escape ? '\\\]' : ']',
    '—': '-',
    '…': '...',
  };

  return input
    .split('')
    .map((char) => punctuationMap[char] || char)
    .join('');
}
