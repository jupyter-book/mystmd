import type { GenericNode } from 'myst-common';
import type { Handler, ITexParser } from './types';

function closeParagraph(node: GenericNode, state: ITexParser) {
  state.closeParagraph();
}

function addText(state: ITexParser, value?: string) {
  if (!value) return;
  state.openParagraph();
  state.text(value);
}

export const BASIC_TEXT_HANDLERS: Record<string, Handler> = {
  string(node, state) {
    addText(state, node.content);
  },
  whitespace(node, state) {
    if (state.data.ignoreNextWhitespace) {
      delete state.data.ignoreNextWhitespace;
      return;
    }
    addText(state, ' ');
  },
  // Ignore comments for now
  comment: closeParagraph,
  macro_newline: closeParagraph,
  parbreak: closeParagraph,
  macro_break: closeParagraph,
  ['macro_\\']: closeParagraph,
  // newpage isn't really appropriate in a web context
  // We could make this into a block in the future?
  macro_newpage: closeParagraph,
};
