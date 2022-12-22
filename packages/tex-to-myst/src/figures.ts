import { u } from 'unist-builder';
import type { Handler } from './types';
import { getArguments, texToText } from './utils';

const FIGURE_HANDLERS: Record<string, Handler> = {
  env_figure(node, state) {
    state.closeParagraph();
    state.openNode('container', { kind: 'figure' });
    state.renderChildren(node);
    state.closeParagraph();
    state.closeNode();
  },
  macro_centering(node, state) {
    state.closeParagraph();
    const container = state.top();
    if (container.type === 'container') {
      container.align = 'center';
    } else {
      state.warn('Unknown use of centering, currently this only works for containers', node);
    }
  },
  macro_includegraphics(node, state) {
    state.closeParagraph();
    const url = texToText(getArguments(node, 'group'));
    // TODO: width, placement, etc.
    state.pushNode(u('image', { url }));
  },
  macro_caption(node, state) {
    state.closeParagraph();
    state.openNode('caption');
    const [children] = getArguments(node, 'group');
    state.openParagraph();
    state.renderChildren(children);
    state.closeParagraph();
    state.closeNode();
  },
  macro_framebox(node, state) {
    state.closeParagraph();
    const [children] = getArguments(node, 'group');
    if (!children) return;
    state.openNode('container', { kind: 'figure' });
    state.renderChildren(children);
    state.closeParagraph();
    state.closeNode();
  },
};

FIGURE_HANDLERS['env_figure*'] = FIGURE_HANDLERS.env_figure;

export { FIGURE_HANDLERS };
