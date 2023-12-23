import { fileWarn, type GenericNode } from 'myst-common';
import type { Image, Table, Code, Math } from 'myst-spec';
import { selectAll } from 'unist-util-select';
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
  const { label, kind } = node;
  const captions = selectAll('caption,legend', node);
  const imagesAndTables = selectAll('image,table', node);
  if (label === 'table10') {
    console.log(imagesAndTables);
  }
  if (imagesAndTables.length !== 1) {
    fileWarn(state.file, `Typst best supports figures with single image or table`, {
      node,
      source: 'myst-to-typst',
      note: `Figure "${label ?? 'unlabeled'}" may not render correctly`,
    });
  }
  if (imagesAndTables.length > 0) {
    state.write('#figure((\n  ');
    imagesAndTables.forEach((item) => {
      state.renderChildren({ children: [item] });
      state.write(',');
    });
    state.trimEnd();
    state.write(').join(),');
  } else {
    state.write('#figure([\n  ');
    state.renderChildren(node, true);
    state.trimEnd();
    state.write('],');
  }
  if (captions.length) {
    state.write('\n  caption: [');
    state.renderChildren(
      {
        children: captions
          .map((cap: GenericNode) => cap.children)
          .filter(Boolean)
          .flat(),
      },
      true,
    );
    state.trimEnd();
    state.write('],');
  }
  if (kind) {
    state.write(`\n  kind: "${kind}",`);
    state.write(`\n  supplement: [${kind[0].toUpperCase() + kind.substring(1)}],`);
  }
  state.write('\n)');
  if (label) state.write(` <${label}>`);
  state.closeBlock(node);
  state.data.isInFigure = prevState;
};

export const captionHandler: Handler = () => {
  // blank
};
