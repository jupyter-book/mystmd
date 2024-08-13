import { u } from 'unist-builder';
import type { GenericNode } from 'myst-common';
import { createId, fileWarn, toText } from 'myst-common';
import type { Handler, ITexParser } from './types.js';
import { getArguments, texToText, unnestParagraphs } from './utils.js';
import type { TableCell } from 'myst-spec-ext';
import type { Table, TableRow } from 'myst-spec';
import type { VFile } from 'vfile';

const ALIGNMENT_MAP = { c: 'center', l: 'left', r: 'right' } as Record<string, TableCell['align']>;
type Alignments = TableCell['align'][] | undefined;

function getTabularAlignment(arg: GenericNode): Alignments {
  if (
    !arg ||
    !(arg.content as GenericNode[]).reduce(
      (b, { type }) => b && ['string', 'whitespace'].includes(type),
      true,
    )
  ) {
    return;
  }
  // This is a spec like `| l | r | c |`
  const spec = texToText(arg.content).replace(/[\s|]/g, '');
  // Only recognize simple specs for now
  if (!spec.match(/([lrc]*)/)) return;
  return spec.split('').map((a) => ALIGNMENT_MAP[a]);
}

function fixTable(vfile: VFile, table: Table, alignments: Alignments) {
  if (table?.type !== 'table') return;
  // Track the rowspan information for each column
  const multirowTracker: { [key: number]: number } = {};

  const rowSizes = table.children.map((tr) => ({
    tr,
    size: (tr.children as TableCell[]).reduce((size, td) => size + (td.colspan ?? 1), 0),
  }));

  const uniqueSizes = [...new Set(rowSizes.map(({ size }) => size))];

  if (uniqueSizes.length !== 1) {
    fileWarn(vfile, `Uneven table found, please check your rows to get an even table.`, {
      node: table,
      note: `Row sizes are: ${rowSizes.map(({ size }) => size).join(', ')}`,
    });
    rowSizes
      .reduce(
        (rows, row, index) => {
          if (index > 0 && rowSizes[index - 1].size !== row.size) {
            rows.push({ ...row, previous: rowSizes[index - 1].size });
          }
          return rows;
        },
        [] as { previous: number; size: number; tr: TableRow }[],
      )
      .forEach(({ tr, size, previous }) => {
        fileWarn(
          vfile,
          `Table row of size (${size}) does not match previous row size (${previous})`,
          {
            node: tr,
          },
        );
      });
  }

  let useAlignments = false;

  if (
    alignments &&
    uniqueSizes.length === 1 &&
    (uniqueSizes[0] === alignments.length || alignments.length === 1)
  ) {
    // The table size equals the alignment sizes
    useAlignments = true;
  } else if (alignments && uniqueSizes.length === 1 && uniqueSizes[0] !== alignments.length) {
    // The table size does not equal the alignment sizes
    fileWarn(vfile, `Table alignment argument does not match number of columns`, { node: table });
  }

  table.children.forEach((tr, rowIndex) => {
    Object.keys(multirowTracker).forEach((key) => {
      const colIndex = key as unknown as number;
      // Decrease the remaining rows for each multirow cell as we move down the table
      if (multirowTracker[colIndex] > 1) {
        multirowTracker[colIndex]--;
      } else {
        delete multirowTracker[colIndex];
      }
    });

    const columnIndex = (tr.children as TableCell[]).reduce(
      (info, td) => {
        info.columnIndex.push(info.size);
        info.size += td.colspan ?? 1;
        return info;
      },
      { columnIndex: [] as number[], size: 0 },
    ).columnIndex;

    tr.children = (tr.children as TableCell[]).filter((td, index) => {
      const colIndex = columnIndex[index];
      if (td.rowspan && td.rowspan > 1) {
        // This cell spans multiple rows, so track it
        for (let col = 0; col < (td.colspan ?? 1); col++) {
          // Handle colspan
          multirowTracker[colIndex + col] = td.rowspan;
        }
      }

      if (alignments && useAlignments && !td.align) {
        // Left is the defualt, no need to add it
        const align = alignments[colIndex] ?? alignments[0];
        if (align !== 'left') td.align = align;
      }

      // If this column is currently tracked as a multirow and the cell is supposed to be empty,
      // check if it's empty. If not, issue a warning.
      if (multirowTracker[colIndex] && td.rowspan !== multirowTracker[colIndex]) {
        if (!isEmptyCell(td)) {
          // Implement isEmptyCell according to your cell structure
          fileWarn(
            vfile,
            `Non-empty placeholder cell found at row ${rowIndex}, column ${colIndex}.`,
            { node: table },
          );
        }
        // Filter out the cell, whether it's empty or not.
        return false;
      }

      return true;
    });
  });
}

function isEmptyCell(cell: TableCell): boolean {
  return toText(cell).trim() === '';
}

const createTable = (addContainer = false) => {
  return (node: GenericNode, state: ITexParser) => {
    state.closeParagraph();
    const table = {
      rows: [] as GenericNode[][][],
      cells: [] as GenericNode[][],
      cell: [] as GenericNode[],
      // These are used for longtable
      caption: undefined as GenericNode | undefined,
      label: undefined as GenericNode | undefined,
      firstHead: [] as GenericNode[][][],
      head: [] as GenericNode[][][],
      foot: [] as GenericNode[][][],
      lastFoot: [] as GenericNode[][][],
    };
    const IGNORE = new Set([
      'cline',
      'hline',
      'rule',
      'midrule',
      'cmidrule',
      'toprule',
      'bottomrule',
      'tophline',
      'middlehline',
      'bottomhline',
    ]);
    const alignments = getTabularAlignment(node.args[node.args.length - 1]);
    node.content.forEach((n: GenericNode) => {
      if (n.type === 'comment') return;
      if (n.type === 'macro' && IGNORE.has(n.content)) return;
      if (n.type === 'macro' && n.content === 'label' && !table.label) {
        // Generally only in longtable
        table.label = n;
        return;
      }
      if (n.type === 'macro' && n.content === 'caption') {
        // Generally only in longtable
        table.caption = n;
        return;
      }
      if (n.type === 'macro' && n.content === 'endfirsthead') {
        table.firstHead = table.rows;
        table.rows = [];
        return;
      }
      if (n.type === 'macro' && n.content === 'endhead') {
        table.head = table.rows;
        table.rows = [];
        return;
      }
      if (n.type === 'macro' && n.content === 'endfoot') {
        table.foot = table.rows;
        table.rows = [];
        return;
      }
      if (n.type === 'macro' && n.content === 'endlastfoot') {
        table.lastFoot = table.rows;
        table.rows = [];
        return;
      }
      if (n.type === 'macro' && (n.content === '\\' || n.content === 'tabularnewline')) {
        table.cells.push(table.cell);
        if (table.cells.flat().length > 0) table.rows.push(table.cells);
        table.cell = [];
        table.cells = [];
        return;
      }
      if (n.type === 'string' && n.content === '&') {
        table.cells.push(table.cell);
        table.cell = [];
        return;
      }
      if (table.cell.length === 0 && (n.type === 'whitespace' || n.type === 'parbreak')) return;
      table.cell.push(n);
    });
    if (table.cell.length > 0) table.cells.push(table.cell);
    if (table.cells.length > 0) table.rows.push(table.cells);
    // Put the headers/footers in (longtable only)
    if (table.firstHead.length > 0) {
      table.rows.unshift(...table.firstHead);
    } else {
      table.rows.unshift(...table.head);
    }
    if (table.lastFoot.length > 0) {
      table.rows.push(...table.lastFoot);
    } else {
      table.rows.push(...table.foot);
    }

    if (addContainer) {
      state.openNode('container', { kind: 'table' });
      if (table.caption) {
        state.renderChildren({ content: [{ type: 'group', content: [table.caption] }] });
      }
      if (table.label) {
        state.renderChildren({ content: [{ type: 'group', content: [table.label] }] });
      }
    }
    state.openNode('table');

    table.rows.forEach((row) => {
      state.openNode('tableRow');
      row.forEach((cell) => {
        // TODO: maybe add heading: true: `rowIndex === 0 ? { header: true } : undefined`
        state.openNode('tableCell');
        state.renderChildren({
          content: [
            {
              // Putting things in a group helps with floating `\bf` commands
              // For example:
              // `& \bf title &` --> `& {\bf title} &`
              type: 'group',
              // Ignore ending whitespace "title &" should become "title"
              content: trimWhitespace(cell),
            },
          ],
        });
        state.closeParagraph();
        unnestParagraphs(state.top(), 'tableCell');
        state.closeNode('tableCell');
      });
      state.closeNode('tableRow');
    });
    const tableNode = state.top();
    fixTable(state.file, tableNode as Table, alignments);
    state.closeNode('table');
    if (addContainer) {
      state.closeParagraph();
      state.closeNode();
    }
  };
};

export const TABLE_HANDLERS: Record<string, Handler> = {
  env_table(node, state) {
    state.closeParagraph();
    state.openNode('container', { kind: 'table' });
    state.renderChildren(node);
    state.closeParagraph();
    state.closeNode();
  },
  ['env_table*'](node, state) {
    state.closeParagraph();
    state.openNode('container', { kind: 'table' });
    state.renderChildren(node);
    state.closeParagraph();
    state.closeNode();
  },
  env_tabular: createTable(),
  env_tabularx: createTable(),
  env_supertabular: createTable(),
  env_longtable: createTable(true),
  'env_longtable*': createTable(true),
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
    const cell = node.args[node.args.length - 1];
    cell.content = trimWhitespace(cell.content);
    state.renderChildren(cell);
    state.closeParagraph();
  },
  macro_multicolumn(node, state) {
    // This macro is defined as:
    //
    // \multicolumn{ncols}{cols}{text}
    const ncolArg = node.args[0];
    const colspan = Number(ncolArg?.content?.[0]?.content);
    const currentNode = state.top();
    const td = currentNode?.type === 'tableCell' ? (currentNode as TableCell) : undefined;
    if (td && Number.isInteger(colspan)) {
      td.colspan = colspan;
    }
    if (td && node.args.length === 3) {
      // ignore borders for now
      const alignmentText = texToText(node.args[1].content).replace(/([|\s])/g, '');
      // Only simple alignment supported
      const align = ALIGNMENT_MAP[alignmentText] || undefined;
      // Align left is the default
      if (align && align !== 'left') {
        td.align = align as TableCell['align'];
      }
    }
    const cell = node.args[node.args.length - 1];
    cell.content = trimWhitespace(cell.content);
    state.renderChildren(cell);
    state.closeNode();
  },
};

function trimWhitespace(content: GenericNode[]): GenericNode[] {
  let startIndex = 0;
  let endIndex = content.length - 1;
  // Trim leading whitespace
  while (startIndex <= endIndex && content[startIndex]?.type === 'whitespace') {
    startIndex++;
  }
  // Trim trailing whitespace
  while (endIndex >= startIndex && content[endIndex]?.type === 'whitespace') {
    endIndex--;
  }
  // Return the trimmed content, or an empty array if only whitespace was present
  return content.slice(startIndex, endIndex + 1);
}
