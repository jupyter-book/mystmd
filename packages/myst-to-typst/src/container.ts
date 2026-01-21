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
  const bracketNode = node.type === 'div' && node.children?.length === 1 ? node.children[0] : node;
  const useBrackets = bracketNode.type !== 'image' && bracketNode.type !== 'table';
  if (node.type === 'legend') {
    state.useMacro('#let legendStyle = (fill: black.lighten(20%), size: 8pt, style: "italic")');
    state.write('text(..legendStyle)');
    node.type = 'paragraph';
  }
  if (useBrackets) state.write('[\n');
  else state.write('\n  ');
  state.renderChildren({ children: [node] });
  if (useBrackets) state.write('\n]');
}

export function getDefaultCaptionSupplement(kind: CaptionKind | string) {
  if (kind === 'code') kind = 'program';
  const domain = kind.includes(':') ? kind.split(':')[1] : kind;
  return `${domain.slice(0, 1).toUpperCase()}${domain.slice(1)}`;
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
  const captionTypes = node.kind === 'table' ? ['caption'] : ['caption', 'legend'];
  const captions: GenericNode[] = node.children?.filter((child: GenericNode) => {
    return captionTypes.includes(child.type);
  });
  let nonCaptions: GenericNode[] = node.children?.filter((child: GenericNode) => {
    return !captionTypes.includes(child.type);
  });
  nonCaptions = [
    ...nonCaptions.filter((child) => child.type !== 'legend'),
    ...nonCaptions.filter((child) => child.type === 'legend'),
  ];
  if (!nonCaptions || nonCaptions.length === 0) {
    fileError(state.file, `Figure with no non-caption content: ${label}`, {
      node,
      source: 'myst-to-typst',
    });
  }
  const flatCaptions = captions
    .map((cap: GenericNode) => cap.children)
    .filter(Boolean)
    .flat();

  if (node.kind === 'quote') {
    const prevIsInBlockquote = state.data.isInBlockquote;
    state.data.isInBlockquote = true;
    state.write('#quote(block: true');
    if (flatCaptions.length > 0) {
      state.write(', attribution: [');
      state.renderChildren(flatCaptions);
      state.write('])[');
    } else {
      state.write(')[');
    }
    state.renderChildren(nonCaptions);
    state.write(']');
    state.data.isInBlockquote = prevIsInBlockquote;
    return;
  }

  // This resets the typst counter to match MyST numbering.
  // However, it is dependent on the resolved enumerator value. This will work given
  // default enumerators, but if the user sets numbering 'template' it will not work.
  // TODO: persist `numbering` metadata in a way that typst can reset based on that.
  if (node.enumerator?.endsWith('.1')) {
    state.write(`#set figure(numbering: "${node.enumerator}")\n`);
    state.write(`#counter(figure.where(kind: "${kind}")).update(0)\n\n`);
  }

  if (nonCaptions && nonCaptions.length > 1) {
    const allSubFigs =
      nonCaptions.filter((item: GenericNode) => item.type === 'container').length ===
      nonCaptions.length;
    state.useMacro('#import "@preview/subpar:0.2.2"');
    state.useMacro('#let breakableDefault = true');
    state.write(
      `#show figure: set block(breakable: ${allSubFigs ? 'false' : 'breakableDefault'})\n`,
    );
    state.write('#subpar.grid(');
    let columns = nonCaptions.length <= 3 ? nonCaptions.length : 2; // TODO: allow this to be customized
    nonCaptions.forEach((item: GenericNode) => {
      if (item.type === 'container') {
        state.write('figure(\n');
        state.renderChildren(item);
        state.write('\n, caption: []),'); // TODO: add sub-captions
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
    state.write(`columns: ${columns},\n`);
    if (label) {
      state.write(`label: <${label}>,`);
      label = undefined;
    }
  } else if (nonCaptions && nonCaptions.length === 1) {
    state.useMacro('#let breakableDefault = true');
    state.write('#show figure: set block(breakable: breakableDefault)\n');
    state.write('#figure(');
    renderFigureChild(nonCaptions[0], state);
    state.write(',');
  } else {
    state.useMacro('#let breakableDefault = true');
    state.write('#show figure: set block(breakable: breakableDefault)\n');
    state.write('#figure([\n  ');
    state.renderChildren(node, 1);
    state.write('],');
  }
  if (captions?.length) {
    state.write('\n  caption: [\n');
    state.renderChildren(flatCaptions);
    state.write('\n],');
  }
  if (kind) {
    const supplement = getDefaultCaptionSupplement(kind);
    state.write(`\n  kind: "${kind}",`);
    state.write(`\n  supplement: [${supplement}],`);
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
