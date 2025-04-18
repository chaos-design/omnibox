export type XPathEvaluatorParams = Parameters<XPathEvaluatorBase['evaluate']>;

export type XPathEvaluatorRemainingParams = {
  resolver?: XPathNSResolver | null;
  type?: number;
  result?: XPathResult | null;
};

export const evaluate = (
  expression: XPathEvaluatorParams[0],
  container?: HTMLElement,
  params?: XPathEvaluatorRemainingParams,
) => {
  const context = container || document.documentElement;

  if (!context || !context?.ownerDocument) {
    return null;
  }

  const selector = context.ownerDocument.evaluate(
    expression,
    context,
    params?.resolver || null,
    params?.type || XPathResult.ANY_TYPE,
    params?.result || null,
  );

  const result = selector.iterateNext();
  console.log(selector, result);
};
