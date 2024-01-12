import { fileError, type GenericNode } from 'myst-common';
import type { Image, Table, Code, Math } from 'myst-spec';
import type { Handler, ITypstSerializer } from './types.js';

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

function renderFigureChild(node: GenericNode, state: ITypstSerializer) {
  const useBrackets = node.type !== 'image' && node.type !== 'table';
  if (useBrackets) state.write('[\n');
  else state.write('\n  ');
  state.renderChildren({ children: [node] });
  if (useBrackets) state.write('\n]');
}

export const containerHandler: Handler = (node, state) => {
  if (state.data.isInTable) {
    fileError(state.file, 'Unable to render typst figure inside table', {
      node,
      source: 'myst-to-typst',
    });
    return;
  }

  state.ensureNewLine();
  state.write('#show figure: set block(breakable: true)');
  state.ensureNewLine();
  const prevState = state.data.isInFigure;
  state.data.isInFigure = true;
  const { identifier: label, kind } = node;
  const captions = node.children?.filter(
    (child: GenericNode) => child.type === 'caption' || child.type === 'legend',
  );
  const nonCaptions = node.children?.filter(
    (child: GenericNode) => child.type !== 'caption' && child.type !== 'legend',
  );
  if (!nonCaptions || nonCaptions.length === 0) {
    fileError(state.file, `Figure with no non-caption content: ${label}`, {
      node,
      source: 'myst-to-typst',
    });
  }
  if (nonCaptions && nonCaptions.length > 1) {
    state.write('#figure((');
    nonCaptions.forEach((item: GenericNode) => {
      renderFigureChild(item, state);
      state.write('\n, ');
    });
    state.write(').join()');
  } else if (nonCaptions && nonCaptions.length === 1) {
    state.write('#figure(');
    renderFigureChild(nonCaptions[0], state);
  } else {
    state.write('#figure([\n  ');
    state.renderChildren(node, 1);
    state.write(']');
  }
  state.write(',');
  if (captions?.length) {
    state.write('\n  caption: [\n');
    state.renderChildren({
      children: captions
        .map((cap: GenericNode) => cap.children)
        .filter(Boolean)
        .flat(),
    });
    state.write('\n],');
  }
  if (kind) {
    state.write(`\n  kind: "${kind}",`);
    state.write(`\n  supplement: [${kind[0].toUpperCase() + kind.substring(1)}],`);
  }
  state.write('\n)');
  if (label) state.write(` <${label}>`);
  state.ensureNewLine(true);
  state.addNewLine();
  state.data.isInFigure = prevState;
};

export const captionHandler: Handler = () => {
  // blank
};
