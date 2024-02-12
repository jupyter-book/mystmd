import type { GenericParent, IExpressionResult } from 'myst-common';
import { fileWarn, RuleId } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { InlineExpression } from 'myst-spec-ext';
import type { StaticPhrasingContent } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { BASE64_HEADER_SPLIT } from './images.js';

export const metadataSection = 'user_expressions';

export interface IUserExpressionMetadata {
  expression: string;
  result: IExpressionResult;
}

export interface IUserExpressionsMetadata {
  [metadataSection]: IUserExpressionMetadata[];
}

export function findExpression(
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
  let content: StaticPhrasingContent[] | undefined;
  if (result.status === 'ok') {
    Object.entries(result.data).forEach(([mimeType, value]) => {
      if (content) {
        return;
      } else if (mimeType.startsWith('image/')) {
        content = [
          {
            type: 'image',
            url: `data:${mimeType}${BASE64_HEADER_SPLIT}${value}`,
          },
        ];
      } else if (mimeType === 'text/latex') {
        content = [{ type: 'inlineMath', value: processLatex(value as string) }];
      } else if (mimeType === 'text/html') {
        content = [{ type: 'html', value: value as string }];
      } else if (mimeType === 'text/plain') {
        content = [{ type: 'text', value: value as string }];
      }
    });
    if (content) return content;
    fileWarn(file, 'Unrecognized mime bundle for inline content', {
      node,
      ruleId: RuleId.inlineExpressionRenders,
    });
  }
  return [];
}

export function transformRenderInlineExpressions(mdast: GenericParent, file: VFile) {
  let count = 0;
  const inlineNodes = selectAll('inlineExpression', mdast) as InlineExpression[];
  inlineNodes.forEach((inlineExpression) => {
    count += 1;
    if (!inlineExpression.result) {
      return;
    }
    inlineExpression.identifier = `eval-${count}`;
    inlineExpression.children = renderExpression(inlineExpression, file);
  });
}

export const renderInlineExpressionsPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree, file) => {
    transformRenderInlineExpressions(tree, file);
  };
