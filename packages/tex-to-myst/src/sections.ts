import type { GenericNode } from 'myst-common';
import type { Handler, ITexParser } from './types';
import { renderInfoIndex, texToText } from './utils';

function addHeading(node: GenericNode, state: ITexParser, depth: number) {
  const attrs: Record<string, any> = { depth };
  const content = node.args[node.args.length - 1];
  const starredIndex = renderInfoIndex(node, 'starred');
  if (starredIndex !== null && node.args[starredIndex].content?.length > 0) {
    attrs.enumerated = false;
  }
  const tocTitleIndex = renderInfoIndex(node, 'tocTitle');
  if (tocTitleIndex !== null && node.args[tocTitleIndex].content?.length > 0) {
    attrs.alt = texToText(node.args[tocTitleIndex].content);
  }
  state.renderBlock(content, 'heading', attrs);
}

export const SECTION_HANDLERS: Record<string, Handler> = {
  macro_section(node, state) {
    state.closeBlock();
    state.openBlock();
    addHeading(node, state, 2);
  },
  macro_subsection(node, state) {
    addHeading(node, state, 3);
  },
  macro_subsubsection(node, state) {
    addHeading(node, state, 4);
  },
  macro_paragraph(node, state) {
    addHeading(node, state, 5);
  },
  macro_subparagraph(node, state) {
    addHeading(node, state, 6);
  },
};
