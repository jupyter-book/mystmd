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
  const prevState = state.data.isInFigure;
  state.data.isInFigure = true;
  const { identifier, kind } = node;
  let label: string | undefined = identifier;
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
    const allSubFigs =
      nonCaptions.filter((item: GenericNode) => item.type === 'container').length ===
      nonCaptions.length;
    state.useMacro('#import "@preview/subpar:0.1.1"');
    state.write(`#show figure: set block(breakable: ${allSubFigs ? 'false' : 'true'})\n`);
    state.write('#subpar.grid(');
    let columns = 2;
    nonCaptions.forEach((item: GenericNode) => {
      if (item.type === 'container') {
        state.write('figure(\n');
        state.renderChildren(item);
        state.write('\n),');
        if (item.identifier) {
          state.write(` <${item.identifier}>,`);
        }
        state.write('\n');
      } else {
        renderFigureChild(item, state);
        state.write(',\n');
        columns = 1;
      }
    });
    state.write(`columns: (${Array(columns).fill('1fr')}),\n`);
    if (label) {
      state.write(`label: <${label}>,`);
      label = undefined;
    }
  } else if (nonCaptions && nonCaptions.length === 1) {
    state.write('#show figure: set block(breakable: true)\n');
    state.write('#figure(');
    renderFigureChild(nonCaptions[0], state);
    state.write(',');
  } else {
    state.write('#show figure: set block(breakable: true)\n');
    state.write('#figure([\n  ');
    state.renderChildren(node, 1);
    state.write('],');
  }
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
