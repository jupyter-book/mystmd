import { u } from 'unist-builder';
import { createId } from 'myst-common';
import type { Handler } from './types.js';
import { getArguments, texToText } from './utils.js';

export const FOOTNOTE_HANDLERS: Record<string, Handler> = {
  macro_footnote(node, state) {
    const label = texToText(getArguments(node, 'argument')) || createId();
    const [body] = getArguments(node, 'group');
    state.pushNode(u('footnoteReference', { label }));
    state.openNode('footnoteDefinition', { label });
    state.renderChildren(body);
    state.closeParagraph();
    state.closeNode();
  },
  macro_footnotemark(node, state) {
    const actualLabel = texToText(getArguments(node, 'argument'));
    const label = actualLabel || createId();
    if (!actualLabel) state.data.lastFootnoteLabel = label;
    state.pushNode(u('footnoteReference', { label }));
  },
  macro_footnotetext(node, state) {
    state.closeParagraph();
    const actualLabel = texToText(getArguments(node, 'argument'));
    const label = actualLabel || state.data.lastFootnoteLabel;
    if (!label) {
      state.error('The footnotetext must come after the "footnotemark"', node, 'footnotetext', {
        note: 'Could not find the label for the footnote, it will likely not work.',
      });
    }
    if (!actualLabel) delete state.data.lastFootnoteLabel;
    const [body] = getArguments(node, 'group');
    state.openNode('footnoteDefinition', { label });
    state.renderChildren(body);
    state.closeParagraph();
    state.closeNode();
  },
};
