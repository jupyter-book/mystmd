import type { Handler } from './types';
import { texToText } from './utils';

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
  env_center(node, state) {
    // not supported at the moment
    state.renderChildren(node);
  },
  macro_framebox(node, state) {
    state.closeParagraph();
    const last = node.children?.pop();
    if (last) state.renderChildren(last);
  },
};
