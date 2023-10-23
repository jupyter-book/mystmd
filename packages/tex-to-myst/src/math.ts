import type { GenericNode } from 'myst-common';
import { u } from 'unist-builder';
import type { Handler, ITexParser } from './types.js';
import { originalValue } from './utils.js';

function mathBlockAsOriginal(node: GenericNode, state: ITexParser) {
  state.closeParagraph();
  const original = originalValue(state.tex, node);
  const value = original?.replace(/(^(\$\$)|(\\\[))|((\$\$)|(\\\])$)/g, '').trim();
  state.pushNode(u('math', { value }));
}

export function createMacroHandler(command: string, macro: GenericNode): Handler {
  return function (node, state) {
    // TODO: the node may have arguments in it
    state.data.ignoreNextWhitespace = true;
    state.renderChildren(macro);
  };
}

// https://en.wikibooks.org/wiki/LaTeX/Labels_and_Cross-referencing
export const MATH_HANDLERS: Record<string, Handler> = {
  inlinemath(node, state) {
    state.openParagraph();
    const original = originalValue(state.tex, node);
    const value = original
      ?.replace(/^\$|(\\\()/g, '')
      .replace(/\$|(\\\))$/g, '')
      .trim();
    state.pushNode(u('inlineMath', { value }));
  },
  displaymath: mathBlockAsOriginal,
  mathenv: mathBlockAsOriginal,
  env_eqnarray: mathBlockAsOriginal,
  env_multline: mathBlockAsOriginal,
  env_gather: mathBlockAsOriginal,
  env_align: mathBlockAsOriginal,
  env_alignat: mathBlockAsOriginal,
  env_flalign: mathBlockAsOriginal,
  env_pmatrix: mathBlockAsOriginal,
  'env_pmatrix*': mathBlockAsOriginal,
  env_bmatrix: mathBlockAsOriginal,
  'env_bmatrix*': mathBlockAsOriginal,
  env_vmatrix: mathBlockAsOriginal,
  'env_vmatrix*': mathBlockAsOriginal,
  env_Vmatrix: mathBlockAsOriginal,
  'env_Vmatrix*': mathBlockAsOriginal,
};
