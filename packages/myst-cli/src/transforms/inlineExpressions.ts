import type { GenericNode, GenericParent } from 'myst-common';
import { fileWarn, NotebookCell, RuleId } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { InlineExpression } from 'myst-spec-ext';
import type { StaticPhrasingContent } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';

export const metadataSection = 'user_expressions';

export interface IBaseExpressionResult {
  status: string;
}

export interface IExpressionOutput extends IBaseExpressionResult {
  status: 'ok';
  data: Record<string, string>;
  metadata: Record<string, string>;
}

export interface IExpressionError extends IBaseExpressionResult {
  status: 'error';
  traceback: string[];
  ename: string;
  evalue: string;
}

export type IExpressionResult = IExpressionError | IExpressionOutput;

export interface IUserExpressionMetadata {
  expression: string;
  result: IExpressionResult;
}

export interface IUserExpressionsMetadata {
  [metadataSection]: IUserExpressionMetadata[];
}

function findExpression(
  expressions: IUserExpressionMetadata[],
  value: string,
): IUserExpressionMetadata | undefined {
  return expressions.find((expr) => expr.expression === value);
}

function processLatex(value: string) {
  return value
    .trim()
    .replace(/^\$(\\displaystyle)?/, '')
    .replace(/\$$/, '')
    .trim();
}

function renderExpression(node: InlineExpression, file: VFile): StaticPhrasingContent[] {
  const result = node.result as IExpressionResult;
  if (!result) return [];
  if (result.status === 'ok') {
    if (result.data['text/latex']) {
      return [{ type: 'inlineMath', value: processLatex(result.data['text/latex']) }];
    } else if (result.data['text/html']) {
      return [{ type: 'html', value: result.data['text/html'] }];
    } else if (result.data['text/plain']) {
      return [{ type: 'text', value: result.data['text/plain'] }];
    }
    fileWarn(file, 'Unrecognized mime bundle for inline content', {
      node,
      ruleId: RuleId.inlineExpressionRenders,
    });
  }
  return [];
}

export function transformInlineExpressions(mdast: GenericParent, file: VFile) {
  const blocks = selectAll('block', mdast).filter(
    (node) => node.data?.type === NotebookCell.content && node.data?.[metadataSection],
  ) as GenericNode[];

  let count = 0;

  blocks.forEach((node) => {
    const userExpressions = node.data?.[metadataSection] as IUserExpressionMetadata[];
    const inlineNodes = selectAll('inlineExpression', node) as InlineExpression[];
    inlineNodes.forEach((inlineExpression) => {
      const data = findExpression(userExpressions, inlineExpression.value);
      if (!data) return;
      count += 1;
      inlineExpression.identifier = `eval-${count}`;
      inlineExpression.result = data.result;
      inlineExpression.children = renderExpression(inlineExpression, file);
    });
  });
}

export const inlineExpressionsPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree, file) => {
    transformInlineExpressions(tree, file);
  };
