import type { GenericNode } from 'myst-common';
import { u } from 'unist-builder';
import type { Handler, ITexParser } from './types.js';
import { getArguments, extractParams, texToText } from './utils.js';

function renderCaption(node: GenericNode, state: ITexParser) {
  state.closeParagraph();
  state.openNode('caption');
  const args = getArguments(node, 'group');
  const children = args[args.length - 1];
  state.openParagraph();
  state.renderChildren(children);
  state.closeParagraph();
  state.closeNode();
}

function centering(node: GenericNode, state: ITexParser) {
  state.closeParagraph();
  const container = state.top();
  if (container.type === 'container') {
    container.align = 'center';
  } else {
    state.warn('Unknown use of centering, currently this only works for containers', node);
  }
}

function renderFigure(node: GenericNode, state: ITexParser) {
  state.closeParagraph();
  state.openNode('container', { kind: 'figure' });
  state.renderChildren(node);
  state.closeParagraph();
  state.closeNode();
}

const FIGURE_HANDLERS: Record<string, Handler> = {
  env_figure: renderFigure,
  env_subfigure: renderFigure,
  env_wrapfigure: renderFigure,
  env_centering(node, state) {
    centering(node, state);
    state.renderChildren(node);
  },
  macro_centering: centering,
  macro_includegraphics(node, state) {
    state.closeParagraph();
    const url = texToText(getArguments(node, 'group'));
    const args = getArguments(node, 'argument')?.[0]?.content ?? [];
    const params = extractParams(args);

    // Only support width and page for now
    for (const key in params) {
      if (key !== 'width' && key !== 'page') {
        delete params[key];
      }
    }

    // TODO: better width, placement, etc.

    // Convert width to percentage if present
    if (params.width) {
      if (typeof params.width === 'number'  && Number.isFinite(params.width)) {
        params.width = `${Math.round(params.width * 100)}%`;
      } else {
        delete params.width; // If width is a string, we don't know what it is, so we ignore it
      }
    }
    if (params.page) {
      if (typeof params.page === 'number' && Number.isFinite(params.page)) {
        params.page = Math.round(Number(params.page)) - 1; // Convert to 0-based for imagemagick
      } else {
        delete params.page;
      }
    }
    state.pushNode(u('image', { url: url, ...params }));
  },
  macro_caption: renderCaption,
  macro_captionof: renderCaption,
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
