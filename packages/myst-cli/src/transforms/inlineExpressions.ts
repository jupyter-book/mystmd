import { fileWarn, RuleId } from 'myst-common';
import type { InlineExpression } from 'myst-spec-ext';
import type { StaticPhrasingContent } from 'myst-spec';
import type { VFile } from 'vfile';
import { BASE64_HEADER_SPLIT } from './images.js';

export const metadataSection = 'user_expressions';

export interface IBaseExpressionResult {
  status: string;
}

export interface IExpressionOutput extends IBaseExpressionResult {
  status: 'ok';
  data: Record<string, any>;
  metadata: Record<string, any>;
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

export function renderExpression(node: InlineExpression, file: VFile): StaticPhrasingContent[] {
  const result = node.data as IExpressionResult | undefined;
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
        content = [{ type: 'inlineMath', value: processLatex(value) }];
      } else if (mimeType === 'text/html') {
        content = [{ type: 'html', value }];
      } else if (mimeType === 'text/plain') {
        content = [{ type: 'text', value }];
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
