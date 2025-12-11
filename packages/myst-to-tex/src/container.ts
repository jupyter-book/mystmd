import type { GenericNode } from 'myst-common';
import type { Image, Table, Code, Math } from 'myst-spec';
import { select } from 'unist-util-select';
import { getColumnWidths } from './tables.js';
import type { Handler } from './types.js';
import { addIndexEntries } from './utils.js';

export enum CaptionKind {
  fig = 'fig',
  eq = 'eq',
  code = 'code',
  table = 'table',
}

function getClasses(className?: string) {
  const classes =
    className
      ?.split(' ')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => !!s) ?? [];
  return [...new Set(classes)];
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
    const nKind = determineCaptionKind(n);
    if (!kind) {
      kind = nKind;
    } else if (nKind) {
      // If there are multiple node kinds, revert to figure
      kind = CaptionKind.fig;
    }
  });
  return kind;
}

function nodeToCommand(node: Image | Table | Code | Math) {
  const kind = determineCaptionKind(node);
  const classes = getClasses((node as any).class);
  const fullWidth = classes.includes('full-width') || classes.includes('w-full');
  switch (kind) {
    case CaptionKind.fig:
      return fullWidth ? 'figure*' : 'figure';
    case CaptionKind.table:
      return fullWidth ? 'table*' : 'table';
    case CaptionKind.code:
      // TODO full width code
      return 'figure';
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
      return 'h';
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
  const { enumerated, label, identifier, multipage } = node;
  const localId = label ?? identifier ?? undefined;
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
  const lastContainer = state.data.isInContainer;
  state.data.isInContainer = true;
  state.data.nextCaptionNumbered = enumerated ?? !!localId;
  state.data.nextCaptionId = localId;
  state.renderChildren(node);
  state.trimEnd();
  state.data.longFigure = undefined;
  state.data.isInContainer = lastContainer;
  state.write(`\n\\end{${command}}`);
  if (after) state.write(after);
  addIndexEntries(node, state);
  state.closeBlock(node);
};

export const captionHandler: Handler = (node, state) => {
  if (state.data.isInTable && node.type !== CaptionKind.table) {
    // Skip captions in tables
    return null;
  }
  state.ensureNewLine(true);
  const { nextCaptionNumbered: numbered, nextCaptionId: id } = state.data;
  // The square brackets here hold the "listoffigures" alternative figure description.
  // This field is present because multi-paragraph captions will fail without
  // this single paragraph alternative. For now, since we do not use "listoffigures"
  // the square brackets are simply left empty. See https://tex.stackexchange.com/a/48313
  // Note: There might be a bug here for multi-paragraph, unnumbered, captions.
  //       The syntax `caption[]*` and `caption*[]` do not work.
  const command = numbered === false ? 'caption*' : 'caption[]';
  const after = numbered && id ? `\\label{${id}}` : '';
  state.renderInlineEnvironment(node, command, { after });
};
