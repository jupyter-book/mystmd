import type { GenericParent, IExpressionResult } from 'myst-common';
import { fileWarn, RuleId } from 'myst-common';
import { selectAll } from 'unist-util-select';
import type { InlineExpression } from 'myst-spec-ext';
import type { StaticPhrasingContent } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { BASE64_HEADER_SPLIT } from './images.js';
import { TexParser } from 'tex-to-myst';

export const metadataSection = 'user_expressions';

export interface IUserExpressionMetadata {
  expression: string;
  result: IExpressionResult;
}

export interface IUserExpressionsMetadata {
  [metadataSection]: IUserExpressionMetadata[];
}

export function findExpression(
  expressions: IUserExpressionMetadata[] | undefined,
  value: string,
): IUserExpressionMetadata | undefined {
  return expressions?.find((expr) => expr.expression === value);
}

function stripTextQuotes(content: string) {
  return content.replace(/^(["'])(.*)\1$/, '$2');
}

type Options = {
  parseMyst: (source: string) => GenericParent;
};

/*
 * Pull out PhrasingContent children
 */
function phrasingChildren(root: GenericParent) {
  if (root.children.length && root.children[0].type === 'paragraph') {
    return root.children[0].children as StaticPhrasingContent[];
  } else {
    return [];
  }
}

function renderExpression(
  node: InlineExpression,
  file: VFile,
  opts: Options,
): StaticPhrasingContent[] {
  const result = node.result as IExpressionResult;
  if (!result) return [];
  let content: StaticPhrasingContent[] | undefined;
  if (result.status === 'ok') {
    Object.entries(result.data).forEach(([mimeType, value]) => {
      if (content) {
        return;
      }
      if (mimeType.startsWith('image/')) {
        content = [
          {
            type: 'image',
            url: `data:${mimeType}${BASE64_HEADER_SPLIT}${value}`,
          },
        ];
      } else {
        switch (mimeType) {
          // Markdown output
          case 'text/markdown': {
            const ast = opts.parseMyst(value as string);
            content = phrasingChildren(ast);
            break;
          }
          case 'text/latex': {
            const parser = new TexParser(value as string, file);
            // Only accept phrasing content (as part of a paragraph))
            content = phrasingChildren(parser.ast as GenericParent);
            break;
          }
          case 'text/html': {
            content = [{ type: 'html', value: value as string }];
            break;
          }
          case 'text/plain': {
            // Allow the user / libraries to explicitly indicate that quotes should be preserved
            const stripQuotes = result.metadata?.['strip-quotes'] ?? true;
            content = [
              {
                type: 'text',
                value: stripQuotes ? stripTextQuotes(value as string) : (value as string),
              },
            ];
            break;
          }
        }
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

export function transformRenderInlineExpressions(mdast: GenericParent, file: VFile, opts: Options) {
  const inlineNodes = selectAll('inlineExpression', mdast) as InlineExpression[];
  inlineNodes.forEach((inlineExpression) => {
    if (!inlineExpression.result) {
      return;
    }
    inlineExpression.children = renderExpression(inlineExpression, file, opts);
  });
}

export const renderInlineExpressionsPlugin: Plugin<[Options], GenericParent, GenericParent> =
  (opts) => (tree, file) => {
    transformRenderInlineExpressions(tree, file, opts);
  };
