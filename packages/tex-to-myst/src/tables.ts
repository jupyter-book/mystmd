import { u } from 'unist-builder';
import type { GenericNode } from 'myst-common';
import { createId } from 'myst-common';
import type { Handler, ITexParser } from './types.js';
import { getArguments, texToText, unnestParagraphs } from './utils.js';

function createTable(node: GenericNode, state: ITexParser) {
  state.closeParagraph();
  const table = {
    rows: [] as GenericNode[][][],
    cells: [] as GenericNode[][],
    cell: [] as GenericNode[],
  };
  const IGNORE = new Set(['hline', 'rule', 'midrule', 'toprule', 'bottomrule']);
  node.content.forEach((n: GenericNode) => {
    if (n.type === 'macro' && IGNORE.has(n.content)) return;
    if (n.type === 'macro' && n.content === '\\') {
      table.cells.push(table.cell);
      table.rows.push(table.cells);
      table.cell = [];
      table.cells = [];
      return;
    }
    if (n.type === 'string' && n.content === '&') {
      table.cells.push(table.cell);
      table.cell = [];
      return;
    }
    if (table.cell.length === 0 && n.type === 'whitespace') return;
    table.cell.push(n);
  });
  if (table.cell.length > 0) table.cells.push(table.cell);
  if (table.cells.length > 0) table.rows.push(table.cells);
  state.openNode('table');
  table.rows.forEach((row, rowIndex) => {
    state.openNode('tableRow');
    row.forEach((cell) => {
      state.openNode('tableCell', rowIndex === 0 ? { header: true } : undefined);
      state.renderChildren({ content: cell });
      state.closeParagraph();
      unnestParagraphs(state.top(), 'tableCell');
      state.closeNode();
    });
    state.closeNode();
  });
  state.closeNode();
}

export const TABLE_HANDLERS: Record<string, Handler> = {
  env_table(node, state) {
    state.closeParagraph();
    state.openNode('container', { kind: 'table' });
    state.renderChildren(node);
    state.closeParagraph();
    state.closeNode();
  },
  env_tabular: createTable,
  env_tabularx: createTable,
  env_supertabular: createTable,
  env_threeparttable(node, state) {
    state.closeParagraph();
    const envId = createId();
    const last = state.data.createId;
    state.data.createId = (tnote?: string) => `${envId}-${tnote || createId()}`;
    state.renderChildren(node);
    state.data.createId = last;
  },
  macro_tnote(node, state) {
    const actualLabel = texToText(getArguments(node, 'group'));
    if (!actualLabel) {
      state.error('The tnote must have a label.', node, 'tnote', {
        note: 'For example, "\\tnote{1}"',
      });
      return;
    }
    const label = state.data.createId?.(actualLabel) || actualLabel;
    state.pushNode(u('footnoteReference', { label }));
  },
  env_tablenotes(node, state) {
    state.closeParagraph();
    const items = node.content.reduce((l: GenericNode[][], n: GenericNode) => {
      const last = l[l.length - 1];
      if (!last && n.type === 'whitespace') return l;
      if ((n.type === 'macro' && n.content === 'item') || !last) {
        l.push([n]);
      } else {
        last.push(n);
      }
      return l;
    }, [] as GenericNode[][]);
    items.forEach((nodes: GenericNode[]) => {
      const [item, ...content] = nodes;
      if (item.type !== 'macro' && item.content !== 'item') {
        state.warn(`Expected an item not ${item.type} as a child of tablenotes`, item);
        return;
      }
      const actualLabel = texToText(getArguments(item, 'argument'));
      if (!actualLabel) {
        state.error('Each tablenote must have a label', node, 'tnote', {
          note: 'For example, "\\item[1]"',
        });
      }
      const label = state.data.createId?.(actualLabel) || actualLabel;
      state.openNode('footnoteDefinition', { label });
      state.renderChildren({ content });
      state.closeParagraph();
      state.closeNode();
    });
  },
  macro_resizebox(node, state) {
    const lastArg = getArguments(node, 'group').pop();
    if (lastArg) state.renderChildren(lastArg);
  },
  env_adjustbox(node, state) {
    state.renderChildren(node);
  },
  macro_makecell(node, state) {
    state.renderChildren(node);
  },
  macro_multirow(node, state) {
    // This macro is defined as:
    //
    // \multirow[vpos]{nrows}[bigstruts]{width}[vmove]{text}
    //
    // We take the first {}-bracket argument as nrows, if it is an integer
    // and the last argument as content. All other arguments are ignored for now.
    const nrowArg = node.args[0]?.openMark === '{' ? node.args[0] : node.args[1];
    const rowspan = Number(nrowArg?.content?.[0]?.content);
    const currentNode = state.top();
    if (currentNode?.type === 'tableCell' && Number.isInteger(rowspan)) {
      currentNode.rowspan = rowspan;
    }
    state.renderChildren(node.args[node.args.length - 1]);
    state.closeParagraph();
  },
  macro_multicolumn(node, state) {
    // This macro is defined as:
    //
    // \multicolumn{ncols}{cols}{text}
    const ncolArg = node.args[0];
    const colspan = Number(ncolArg?.content?.[0]?.content);
    const currentNode = state.top();
    if (currentNode?.type === 'tableCell' && Number.isInteger(colspan)) {
      currentNode.colspan = colspan;
    }
    state.renderChildren(node.args[node.args.length - 1]);
    state.closeNode();
  },
};
