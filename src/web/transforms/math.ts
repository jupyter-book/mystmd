import katex from 'katex';
import { Math, InlineMath } from 'myst-spec';
import { visit } from 'mystjs';
import { Root } from './types';

const macros = {};

export function renderEquation(node: Math | InlineMath) {
  const { value } = node;
  if (!value) return;
  const displayMode = node.type === 'math';
  try {
    (node as any).html = katex.renderToString(value, { displayMode, macros });
  } catch (error) {
    const { message } = error as unknown as Error;
    (node as any).error = true;
    (node as any).message = message;
  }
}

export function transformMath(mdast: Root) {
  // TODO: do this in a single path!
  visit(mdast, 'math', renderEquation);
  visit(mdast, 'inlineMath', renderEquation);
}
