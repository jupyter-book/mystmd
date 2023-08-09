import type { Plugin } from 'unified';
import type { Table, TableRow } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import type { GenericParent } from 'myst-common';

export function tableTransform(mdast: GenericParent) {
  const tables = selectAll('table', mdast) as Table[];
  tables.forEach((table) => {
    const head: { type: 'tableHead'; children: TableRow[] } = { type: 'tableHead', children: [] };
    const body: { type: 'tableBody'; children: TableRow[] } = { type: 'tableBody', children: [] };
    table.children.forEach((tr) => {
      const isHeaderRow = tr.children.reduce((h, v) => h && !!v.header, true);
      if (isHeaderRow && body.children.length === 0) {
        head.children.push(tr);
      } else {
        body.children.push(tr);
      }
    });
    (table as any).children = head.children.length > 0 ? [head, body] : [body];
  });
}

export const tablePlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  tableTransform(tree);
};
