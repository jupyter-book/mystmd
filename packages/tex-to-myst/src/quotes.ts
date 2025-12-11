import type { GenericNode } from 'myst-common';
import type { Handler, ITexParser } from './types.js';
import { getArguments } from './utils.js';

function quoteHandler(node: GenericNode, state: ITexParser) {
  state.closeParagraph();
  state.openNode('blockquote');
  state.openParagraph();
  state.renderChildren(node);
  state.closeParagraph();
  state.closeNode();
}

export const QUOTE_HANDLERS: Record<string, Handler> = {
  env_quote: quoteHandler,
  env_quotation: quoteHandler,
  env_displayquote: quoteHandler,
  macro_epigraph(node, state) {
    const [quote, author] = getArguments(node, 'group');
    if (author) {
      state.openNode('container', { kind: 'quote' });
    }
    state.openNode('blockquote');
    state.openParagraph();
    state.renderChildren(quote);
    state.closeParagraph();
    state.closeNode();
    if (!author) return;
    state.openNode('caption');
    state.openParagraph();
    state.renderChildren(author);
    state.closeParagraph();
    state.closeNode();
    state.closeNode(); // the container
  },
};
