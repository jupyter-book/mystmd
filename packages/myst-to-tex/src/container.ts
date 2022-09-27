import type { Container, Image, Table, Code, Math } from 'myst-spec';
import { select } from 'unist-util-select';
import { getColumnWidths } from './tables';
import type { Handler } from './types';

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

export function determineCaptionKind(
  node: Container | Image | Table | Code | Math,
): CaptionKind | null {
  if (node.type !== 'container') return switchKind(node);
  const childrenKinds: CaptionKind[] = [];
  node.children.forEach((n) => {
    const kind = switchKind(n as any);
    if (kind) childrenKinds.push(kind);
  });
  return childrenKinds[0] ?? null;
}

function nodeToCommand(node: Image | Table | Code | Math) {
  const kind = determineCaptionKind(node);
  switch (kind) {
    case CaptionKind.fig:
      return (node as any).fullpage ? 'figure*' : 'figure';
    case CaptionKind.table:
      return (node as any).fullpage ? 'table*' : 'table';
    case CaptionKind.code:
      // TODO full width code
      return 'code';
    case CaptionKind.eq:
      return 'figure'; // not sure what to do here.
    default:
      return 'figure';
  }
}

function nodeToLaTeXOptions(node: Image | Table | Code | Math) {
  const kind = determineCaptionKind(node);
  switch (kind) {
    case CaptionKind.fig:
    case CaptionKind.table:
      return '!htbp';
    case CaptionKind.code:
      return 'H';
    case CaptionKind.eq:
    default:
      return undefined;
  }
}

export const containerHandler: Handler = (node, state) => {
  if (state.data.isInTable) {
    state.renderChildren(node);
    return;
  }
  const table = select('table', node) as Table | null;
  const containsTable = !!table;
  let tableInfo: ReturnType<typeof getColumnWidths> | undefined;
  if (table && node.multipage) {
    tableInfo = getColumnWidths(table);
  }
  let before: string | undefined;
  let after: string | undefined;
  if (node.landscape) {
    state.usePackages('pdflscape');
    before = '\\begin{landscape}';
    after = '\\end{landscape}';
  }
  const { enumerated, identifier, multipage } = node;
  const localId = state.options.localizeId?.(identifier ?? '') ?? identifier ?? undefined;
  // TODO for longtable to work with two columns we need to flip out to single column first
  // and then back to multi column, if we were in multicolumn mode
  // Q: we can know if we are in a two column mode from the template we are using, but how is this made available at this level?
  const command = containsTable && multipage ? 'longtable' : nodeToCommand(node);
  if (command === 'longtable') state.usePackages('longtable');
  const commandOpts = containsTable && tableInfo ? tableInfo.columnSpec : undefined;
  const bracketOpts = containsTable ? undefined : nodeToLaTeXOptions(node);
  if (before) state.write(before);
  const optsInCommand = commandOpts ? `{${commandOpts}}` : '';
  const optsInBrackets = bracketOpts ? `[${bracketOpts}]` : '';
  state.write(`\\begin{${command}}${optsInCommand}${optsInBrackets}\n`);

  // TODO: Based on align attr
  // may have to modify string returned by state.renderContent(n);
  // https://tex.stackexchange.com/questions/91566/syntax-similar-to-centering-for-right-and-left

  // centering does not work in a longtable environment
  if (!multipage || !containsTable) state.write('\\centering');
  state.ensureNewLine();
  state.data.longFigure = multipage;
  state.data.nextCaptionNumbered = enumerated ?? !!localId;
  state.data.nextCaptionId = localId;
  state.renderChildren(node);
  state.trimEnd();
  state.data.longFigure = undefined;
  state.write(`\n\\end{${command}}`);
  if (after) state.write(after);
  state.closeBlock(node);
};

export const captionHandler: Handler = (node, state) => {
  if (state.data.isInTable && node.type !== CaptionKind.table) {
    // Skip captions in tables
    return null;
  }
  state.ensureNewLine(true);
  const { nextCaptionNumbered: numbered, nextCaptionId: id } = state.data;
  const command = numbered === false ? 'caption*' : 'caption';
  const after = numbered && id ? `\\label{${id}}` : '';
  state.renderInlineEnvironment(node, command, { after });
};
