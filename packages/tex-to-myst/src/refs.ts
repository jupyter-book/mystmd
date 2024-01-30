import { u } from 'unist-builder';
import type { Handler } from './types.js';
import { getArguments, texToText } from './utils.js';

// https://en.wikibooks.org/wiki/LaTeX/Labels_and_Cross-referencing
export const REF_HANDLERS: Record<string, Handler> = {
  macro_label(node, state) {
    state.closeParagraph();
    const label = texToText(node);
    const parent = state.top();
    const last = parent?.children?.slice(-1)[0];
    if (parent?.type === 'container') {
      parent.label = label;
    } else if (
      parent?.type === 'caption' &&
      state.stack[state.stack.length - 2].type === 'container'
    ) {
      state.stack[state.stack.length - 2].label = label;
    } else {
      if (!last) {
        if (parent) parent.label = label;
        return;
      }
      if (!parent) return;
      last.label = label;
    }
  },
  macro_ref(node, state) {
    state.openParagraph();
    const label = texToText(getArguments(node, 'group'));
    state.pushNode(u('crossReference', { label }, [u('text', '%s')]));
  },
  macro_nameref(node, state) {
    state.openParagraph();
    const label = texToText(getArguments(node, 'group'));
    state.pushNode(u('crossReference', { label }, [u('text', '{name}')]));
  },
  macro_pageref(node, state) {
    state.openParagraph();
    const label = texToText(getArguments(node, 'group'));
    state.pushNode(u('crossReference', { label }));
    state.warn('MyST does not support page references.', node);
  },
  macro_autoref(node, state) {
    state.openParagraph();
    const label = texToText(getArguments(node, 'group'));
    state.pushNode(u('crossReference', { label }));
  },
  macro_eqref(node, state) {
    state.openParagraph();
    const label = texToText(getArguments(node, 'group'));
    state.pushNode(u('crossReference', { label }));
  },
  macro_cref(node, state) {
    state.openParagraph();
    const label = texToText(getArguments(node, 'group'));
    state.pushNode(u('crossReference', { label }, []));
  },
};
