import { fileError, type GenericNode } from 'myst-common';
import type { Image, Table, Code, Math } from 'myst-spec';
import { select } from 'unist-util-select';
import { getColumnWidths } from './tables.js';
import type { Handler } from './types.js';

export enum CaptionKind {
  fig = 'fig',
  eq = 'eq',
  code = 'code',
  table = 'table',
}

function switchKind(node: Image | Table | Code | Math) {
  switch (node.type as string) {
    case 'iframe':
    case 'image':
      return CaptionKind.fig;
    case 'table':
      return CaptionKind.table;
    case 'code':
      return CaptionKind.code;
    case 'math':
      return CaptionKind.eq;
    default:
      return null;
  }
}

export function determineCaptionKind(node: GenericNode): CaptionKind | null {
  let kind = switchKind(node as any);
  node.children?.forEach((n) => {
    if (!kind) kind = determineCaptionKind(n);
  });
  return kind;
}

export const containerHandler: Handler = (node, state) => {
  state.ensureNewLine();
  const prevState = state.data.isInFigure;
  state.data.isInFigure = true;
  const { label } = node;
  const caption = select('caption', node);
  const image = select('image', node);
  if (!image) {
    fileError(state.file, `Figure only supports image children at the moment!`, {
      node,
      source: 'myst-to-typst',
    });
    return;
  }
  state.write('#figure(\n  ');
  state.renderChildren({ children: [image] }, true);
  state.trimEnd();
  state.write(',');
  if (caption) {
    state.write('\n  caption: [');
    state.renderChildren(caption, true);
    state.trimEnd();
    state.write('],');
  }
  state.write('\n)');
  if (label) state.write(` <${label}>`);
  state.closeBlock(node);
  state.data.isInFigure = prevState;
};

export const captionHandler: Handler = () => {
  // blank
};
