import type { Handler } from './types.js';
import { fileError, type GenericNode } from 'myst-common';

function countColumns(table: GenericNode) {
  const firstRow = table.children?.find((child) => child.type === 'tableRow');
  const columns = firstRow?.children
    ?.filter((cell: GenericNode) => cell.type === 'tableCell')
    .reduce((val: number, cell: GenericNode) => val + (cell.colspan ?? 1), 0);
  return columns;
}

function isHeaderRow(node: GenericNode) {
  if (node.type !== 'tableRow') return false;
  return node.children
    ?.filter((child) => child.type === 'tableCell')
    .every((child) => child.header);
}

function countHeaderRows(table: GenericNode) {
  const headerRows = table.children?.filter((child) => isHeaderRow(child));
  return headerRows?.length ?? 0;
}

export const tableHandler: Handler = (node, state) => {
  const prevState = state.data.isInTable;
  state.data.isInTable = true;

  const command = state.data.isInFigure ? 'table' : '#table';
  const columns = countColumns(node);

  if (!columns) {
    fileError(state.file, 'Unable to count table columns', {
      node,
      source: 'myst-to-typst',
    });
    state.data.isInTable = prevState;
    return;
  }

  state.write(`${command}(columns: ${columns},\n`);

  state.renderChildren(node, 1);
  state.write(')\n');

  state.data.isInTable = prevState;
};

export const tableRowHandler: Handler = (node, state) => {
  state.renderChildren(node, 1);
};

export const tableCellHandler: Handler = (node, state) => {
  if (node.rowspan || node.colspan || node.align || node.style?.backgroundColor) {
    state.write('cellx(');
    if (node.rowspan) {
      state.write(`rowspan: ${node.rowspan}, `);
    }
    if (node.colspan) {
      state.write(`colspan: ${node.colspan}, `);
    }
    if (node.align) {
      state.write(`align: ${node.align}, `);
    }
    if (node.style?.backgroundColor) {
      const fill = node.style.backgroundColor as string;
      const rgb = fill.startsWith('#');
      state.write(`fill: ${rgb ? `rgb("${fill}")` : fill}, `);
    }
    state.write(')');
  }
  state.write('[\n');
  state.renderChildren(node, 1);
  state.write('],\n');
};
