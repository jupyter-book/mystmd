import type { Handler } from './types';

const accents = {
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
    Object.entries(accents).map(([macro, kind]): [string, Handler] => {
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
};

export { TEXT_MARKS_HANDLERS };
