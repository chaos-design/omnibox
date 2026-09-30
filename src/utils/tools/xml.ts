export interface XPathQueryResult {
  truncated: boolean;
  type: 'nodes' | 'string' | 'number' | 'boolean';
  values: string[];
}

const parserErrorNamespaces = new Set([
  'http://www.mozilla.org/newlayout/xml/parsererror.xml',
  'http://www.w3.org/1999/xhtml',
]);

function assertSafeXml(input: string): void {
  if (/<!DOCTYPE|<!ENTITY/iu.test(input)) {
    throw new Error('XML 不允许包含 DOCTYPE 或实体声明。');
  }

  if (!input.trim()) {
    throw new Error('请输入 XML 内容。');
  }
}

export function parseXml(input: string): XMLDocument {
  assertSafeXml(input);
  const document = new DOMParser().parseFromString(input, 'application/xml');
  const parserError = Array.from(
    document.getElementsByTagName('parsererror'),
  ).find((element) => parserErrorNamespaces.has(element.namespaceURI ?? ''));

  if (parserError) {
    throw new Error(
      `XML 格式无效：${parserError.textContent?.trim() || '解析失败'}`,
    );
  }

  return document;
}

function hasMeaningfulText(element: Element): boolean {
  return Array.from(element.childNodes).some(
    (node) =>
      (node.nodeType === Node.TEXT_NODE ||
        node.nodeType === Node.CDATA_SECTION_NODE) &&
      Boolean(node.nodeValue?.trim()),
  );
}

function hasInlineWhitespace(element: Element): boolean {
  return Array.from(element.childNodes).some(
    (node) =>
      node.nodeType === Node.TEXT_NODE &&
      Boolean(node.nodeValue) &&
      !/[\r\n\t]/u.test(node.nodeValue ?? ''),
  );
}

function removeIndentation(node: Node): void {
  Array.from(node.childNodes).forEach((child) => {
    if (
      child.nodeType === Node.TEXT_NODE &&
      !child.nodeValue?.trim() &&
      /[\r\n\t]/u.test(child.nodeValue ?? '')
    ) {
      child.remove();
      return;
    }

    removeIndentation(child);
  });
}

function indentElement(element: Element, depth: number): void {
  const childElements = Array.from(element.children);
  childElements.forEach((child) => indentElement(child, depth + 1));

  if (
    childElements.length === 0 ||
    hasMeaningfulText(element) ||
    hasInlineWhitespace(element)
  ) {
    return;
  }

  const document = element.ownerDocument;
  const children = Array.from(element.childNodes);
  const childIndent = `\n${'  '.repeat(depth + 1)}`;
  const closingIndent = `\n${'  '.repeat(depth)}`;

  children.forEach((child) => {
    element.insertBefore(document.createTextNode(childIndent), child);
  });
  element.append(document.createTextNode(closingIndent));
}

function serialize(document: XMLDocument): string {
  return new XMLSerializer().serializeToString(document);
}

export function formatXml(input: string): string {
  const declaration = /^\s*(<\?xml[^?]*\?>)/iu.exec(input)?.[1];
  const document = parseXml(input);
  removeIndentation(document);
  indentElement(document.documentElement, 0);
  const output = serialize(document);

  return declaration ? `${declaration}\n${output}` : output;
}

export function minifyXml(input: string): string {
  const declaration = /^\s*(<\?xml[^?]*\?>)/iu.exec(input)?.[1];
  const document = parseXml(input);
  removeIndentation(document);
  const output = serialize(document);

  return declaration ? `${declaration}${output}` : output;
}

function serializeXPathNode(node: Node): string {
  if (
    node.nodeType === Node.ELEMENT_NODE ||
    node.nodeType === Node.DOCUMENT_NODE
  ) {
    return new XMLSerializer().serializeToString(node);
  }

  return node.nodeValue ?? node.textContent ?? '';
}

export function queryXml(
  input: string,
  expression: string,
  limit = 200,
): XPathQueryResult {
  if (!expression.trim()) {
    throw new Error('请输入 XPath 表达式。');
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('XPath 结果限制必须是正整数。');
  }

  const document = parseXml(input);
  let result: XPathResult;

  try {
    result = document.evaluate(
      expression,
      document,
      document.createNSResolver(document.documentElement),
      XPathResult.ANY_TYPE,
      null,
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`XPath 表达式无效：${reason}`);
  }

  if (result.resultType === XPathResult.STRING_TYPE) {
    return {
      truncated: false,
      type: 'string',
      values: [result.stringValue],
    };
  }

  if (result.resultType === XPathResult.NUMBER_TYPE) {
    return {
      truncated: false,
      type: 'number',
      values: [String(result.numberValue)],
    };
  }

  if (result.resultType === XPathResult.BOOLEAN_TYPE) {
    return {
      truncated: false,
      type: 'boolean',
      values: [String(result.booleanValue)],
    };
  }

  const values: string[] = [];
  let node = result.iterateNext();

  while (node && values.length < limit) {
    values.push(serializeXPathNode(node));
    node = result.iterateNext();
  }

  return {
    truncated: node !== null,
    type: 'nodes',
    values,
  };
}
