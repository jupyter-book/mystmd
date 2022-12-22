import { u } from 'unist-builder';
import type { Handler } from './types';
import { getArguments, texToText } from './utils';

// https://en.wikibooks.org/wiki/LaTeX/Hyperlinks
export const LINK_HANDLERS: Record<string, Handler> = {
  macro_href(node, state) {
    state.openParagraph();
    const [urlNode, textNode] = getArguments(node, 'group');
    const url = texToText(urlNode);
    state.renderInline(textNode.content, 'link', { url });
  },
  macro_url(node, state) {
    state.openParagraph();
    const url = texToText(node);
    state.pushNode(u('link', { url }, [u('text', url)]));
  },
  macro_hyperref(node, state) {
    // \hyperref[mainlemma]{lemma \ref*{mainlemma}}
    state.openParagraph();
    const [urlNode] = getArguments(node, 'argument');
    const [textNode] = getArguments(node, 'group');
    const url = texToText(urlNode);
    state.renderInline(textNode.content, 'link', { url });
  },
};
