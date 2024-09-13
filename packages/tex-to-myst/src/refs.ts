import { u } from 'unist-builder';
import type { Handler } from './types.js';
import { getArguments, hasStar, texToText } from './utils.js';
import type { GenericNode } from 'myst-common';

// https://en.wikibooks.org/wiki/LaTeX/Labels_and_Cross-referencing
export const REF_HANDLERS: Record<string, Handler> = {
  macro_label(node, state) {
    state.closeParagraph();
    const label = texToText(node);
    const parent = state.top();
    const last = parent?.children?.slice(-1)[0];
    const grandparent = state.stack[state.stack.length - 2];
    if (!parent?.label && (parent?.type === 'container' || parent?.type === 'proof')) {
      parent.label = label;
    } else if (
      !grandparent?.label &&
      ((parent?.type === 'caption' && grandparent?.type === 'container') ||
        grandparent?.type === 'proof')
    ) {
      grandparent.label = label;
    } else {
      if (!last) {
        if (parent && !parent.label) parent.label = label;
        return;
      }
      if (!parent) return;
      if (!last?.label) last.label = label;
    }
  },
  macro_ref(node, state) {
    state.openParagraph();
    const label = texToText(getArguments(node, 'group'));
    const xref = u('crossReference', { label }, [u('text', '%s')]) as GenericNode;
    if (hasStar(node)) {
      // The \ref* command is similar to the regular \ref command, but it suppresses the hyperlink.
      // It only displays the label's reference number.
      xref.noLink = true;
    }
    state.pushNode(xref);
  },
  macro_subref(node, state) {
    state.openParagraph();
    const label = texToText(getArguments(node, 'group'));
    state.pushNode(u('crossReference', { label }, [u('text', '{subEnumerator}')]));
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
