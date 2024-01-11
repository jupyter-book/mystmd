import { fileError, fileWarn, type GenericNode } from 'myst-common';
import type { Image, Table, Code, Math } from 'myst-spec';
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
  if (state.data.isInTable) {
    fileError(state.file, 'Unable to render typst figure inside table', {
      node,
      source: 'myst-to-typst',
    });
    return;
  }
  state.useMacro('#show figure: set block(breakable: true)');
  state.ensureNewLine();
  const prevState = state.data.isInFigure;
  state.data.isInFigure = true;
  const { label, kind } = node;
  const captions = node.children?.filter(
    (child: GenericNode) => child.type === 'caption' || child.type === 'legend',
  );
  const imagesAndTables = node.children?.filter(
    (child: GenericNode) => child.type === 'image' || child.type === 'table',
  );
  if (!imagesAndTables || imagesAndTables.length !== 1) {
    console.log(node.children.map((child: GenericNode) => child.type));
    if (label === 'table3') console.log(JSON.stringify(node, null, 2));
    fileWarn(state.file, `Typst best supports figures with single image or table`, {
      node,
      source: 'myst-to-typst',
      note: `Figure "${label ?? 'unlabeled'}" may not render correctly`,
    });
  }
  if (imagesAndTables && imagesAndTables.length > 1) {
    state.write('#figure((\n  ');
    imagesAndTables.forEach((item: GenericNode) => {
      state.renderChildren({ children: [item] });
      state.trimEnd();
      state.write('\n,');
    });
    state.write(').join(),');
  } else if (imagesAndTables && imagesAndTables.length === 1) {
    state.write('#figure(\n  ');
    state.renderChildren({ children: [imagesAndTables[0]] });
    state.trimEnd();
    state.write(',');
  } else {
    state.write('#figure([\n  ');
    state.renderChildren(node, true);
    state.trimEnd();
    state.write('\n],');
  }
  if (captions?.length) {
    state.write('\n  caption: [\n');
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
    state.write('\n],');
  }
  if (kind) {
    state.write(`\n  kind: "${kind}",`);
    state.write(`\n  supplement: [${kind[0].toUpperCase() + kind.substring(1)}],`);
  }
  state.write('\n)');
  if (label) state.write(` <${label}>`);
  state.ensureNewLine(true);
  state.data.isInFigure = prevState;
};

export const captionHandler: Handler = () => {
  // blank
};
