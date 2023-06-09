import type { GenericNode } from 'myst-common';
import type { Handler, ITexParser } from './types.js';
import { UNHANDLED_ERROR_TEXT, isAccent } from './utils.js';

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
  argument(node, state) {
    // often the contents of a group (e.g. caption)
    state.renderChildren(node);
  },
  group(node, state) {
    // Some accents can come in as groups
    if (isAccent(node.content?.[0])) {
      const accent = { ...node.content[0] };
      accent.args = [
        {
          type: 'argument',
          openMark: '{',
          closeMark: '}',
          content: node.content.slice(1).filter((n: GenericNode) => n.type !== 'whitespace'),
        },
      ];
      state.renderChildren({ type: 'group', content: [accent] });
      return;
    }
    // often the contents of a group (e.g. caption)
    const prev = state.data.openGroups;
    state.renderChildren(node);
    // We want to backout of the groups and close any open nodes that are terminated by this group
    // For example "{\bf text} not bold"
    state.data.openGroups.reverse().forEach((kind) => {
      const topType = state.top().type;
      if (topType === 'root') return;
      if (topType === kind) {
        state.closeNode();
      }
    });
    state.data.openGroups = prev;
  },
  env_document(node, state) {
    state.closeParagraph();
    let stack: GenericNode;
    do {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      stack = state.closeNode();
    } while (state.stack.length);
    // Remove the unhandled errors
    state.file.messages = state.file.messages.filter(
      (m) => !m.message.includes(UNHANDLED_ERROR_TEXT),
    );
    state.stack = [{ type: 'root', children: [] }];
    state.renderChildren(node);
  },
  comment: () => {
    // Ignore comments for now
  },
  // Ways to break text...
  macro_newline: closeParagraph,
  parbreak: closeParagraph,
  macro_break: closeParagraph,
  ['macro_\\']: closeParagraph,
  // newpage isn't really appropriate in a web context
  // We could make this into a block in the future?
  macro_newpage: closeParagraph,
  macro_FloatBarrier: closeParagraph,
};
