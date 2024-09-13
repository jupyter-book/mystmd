import type { GenericNode } from 'myst-common';
import { copyNode } from 'myst-common';
import type { Handler } from './types.js';
import { getArguments, texToText } from './utils.js';

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
  env_minipage(node, state) {
    state.closeParagraph();
    const top = state.top();
    if (top?.type === 'container' && top?.kind === 'figure' && top?.children?.length) {
      const topCopy = copyNode({ ...top, children: [] }) as GenericNode;
      delete topCopy.label;
      delete topCopy.identifier;
      delete topCopy.html_id;
      state.closeNode();
      state.openNode('container', topCopy);
    }
    state.renderChildren(node);
  },
  env_adjustwidth(node, state) {
    state.closeParagraph();
    state.renderChildren(node);
  },
  macro_mbox(node, state) {
    const [content] = getArguments(node, 'group');
    state.renderChildren(content);
  },
  macro_and(node, state) {
    state.data.andCallback?.();
  },
  env_landscape(node, state) {
    state.closeParagraph();
    state.openBlock({ landscape: true });
    state.renderChildren(node);
    state.closeParagraph();
    state.closeBlock();
  },
  macro_input(node, state) {
    const [content] = getArguments(node, 'group');
    const file = texToText(content);
    state.addLeaf('include', { file: file.endsWith('.tex') ? file : `${file}.tex` });
  },
  macro_noindent: pass,
  macro_acknowledgments: pass,
  macro_def: pass,
  macro_arraystretch: pass,
  // Some size options, not respecting at the moment
  macro_vspace: pass,
  macro_hfill: pass,
  macro_tiny: pass,
  macro_small: pass,
  macro_footnotesize: pass,
  macro_normalsize: pass,
  macro_large: pass,
  macro_Large: pass,
  macro_LARGE: pass,
  macro_huge: pass,
  // These are sometimes used in tables...
  macro_bgroup: pass,
  macro_egroup: pass,
  // Used with adjustbox...
  macro_textwidth: pass,
  macro_onecolumn: pass,
  macro_linewidth: pass,
  // line numbers
  macro_linenumbers: pass,
  macro_nolinenumbers: pass,
  // counters
  macro_setcounter: pass,
};
