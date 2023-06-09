import { u } from 'unist-builder';
import type { Handler } from './types.js';

const marks = {
  textbf: 'strong',
  emph: 'emphasis',
  textit: 'emphasis',
  texttt: 'inlineCode',
  textsc: 'smallcaps',
  textsubscript: 'subscript',
  textsuperscript: 'superscript',
  hl: 'strong', // This needs to be done!
};

const TEXT_MARKS_HANDLERS: Record<string, Handler> = {
  ...Object.fromEntries(
    Object.entries(marks).map(([macro, kind]): [string, Handler] => {
      return [
        `macro_${macro}`,
        (node, state) => {
          state.renderInline(node.args, kind);
        },
      ];
    }),
  ),
  macro_bf(node, state) {
    if (node.args && node.args.length > 0) {
      state.renderInline(node.args, 'strong');
      return;
    }
    state.openParagraph();
    state.openNode('strong');
    state.data.openGroups.push('strong');
    state.data.ignoreNextWhitespace = true;
  },
  macro_em(node, state) {
    if (node.args && node.args.length > 0) {
      state.renderInline(node.args, 'emphasis');
      return;
    }
    state.openParagraph();
    state.openNode('emphasis');
    state.data.openGroups.push('emphasis');
    state.data.ignoreNextWhitespace = true;
  },
  macro_ttfamily(node, state) {
    if (node.args && node.args.length > 0) {
      state.renderInline(node.args, 'inlineCode');
      return;
    }
    state.openParagraph();
    state.openNode('inlineCode');
    state.data.openGroups.push('inlineCode');
    state.data.ignoreNextWhitespace = true;
  },
  verb(node, state) {
    state.openParagraph();
    state.pushNode(u('inlineCode', node.content));
  },
};

export { TEXT_MARKS_HANDLERS };
