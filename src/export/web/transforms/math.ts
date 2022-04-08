import katex from 'katex';
import { GenericNode, visit } from 'mystjs';
import { Root } from './types';

export function renderEquation(value: string | undefined, displayMode: boolean) {
  if (!value) return null;
  return katex.renderToString(value, { displayMode });
}

export function transformMath(mdast: Root) {
  visit(mdast, 'math', (node: GenericNode) => {
    node.html = renderEquation(node.value, true);
  });
  visit(mdast, 'inlineMath', (node: GenericNode) => {
    node.html = renderEquation(node.value, false);
  });
}
