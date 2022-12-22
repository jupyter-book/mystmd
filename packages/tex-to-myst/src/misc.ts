import type { Handler } from './types';
import { texToText } from './utils';

function pass() {
  // pass
}

export const MISC_HANDLERS: Record<string, Handler> = {
  macro_bibliography(node, state) {
    state.closeParagraph();
    // pass, we will auto create a bibliography
    const files = texToText(node)
      .split(',')
      .map((t) => t.trim())
      .filter((t) => !!t);
    state.data.bibliography.push(...files);
  },
  macro_bibliographystyle: pass,
  env_center(node, state) {
    state.closeParagraph();
    state.renderChildren(node);
    // Also put something on the parent
    const parent = state.top();
    const last = parent?.children?.slice(-1)[0];
    if (!last) {
      if (parent) parent.align = 'center';
      return;
    }
    if (!parent) return;
    if (parent.type === 'container') {
      parent.align = 'center';
    } else {
      last.align = 'center';
    }
  },
  macro_and(node, state) {
    state.data.andCallback?.();
  },
  macro_noindent: pass,
  macro_acknowledgments: pass,
  macro_footnotesize: pass,
};
