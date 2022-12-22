import type { GenericNode } from 'myst-common';
import type { Handler } from './types';
import { unnestParagraphs } from './utils';

export const TABLE_HANDLERS: Record<string, Handler> = {
  env_table(node, state) {
    state.closeParagraph();
    state.openNode('container', { kind: 'table' });
    state.renderChildren(node);
    state.closeParagraph();
    state.closeNode();
  },
  env_tabular(node, state) {
    const table = {
      rows: [] as GenericNode[][][],
      cells: [] as GenericNode[][],
      cell: [] as GenericNode[],
    };
    const IGNORE = new Set(['hline', 'rule']);
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
  },
};
