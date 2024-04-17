import type {
  DirectiveSpec,
  DirectiveData,
  DirectiveContext,
  GenericNode,
  GenericParent,
} from 'myst-common';
import { fileError, normalizeLabel, RuleId } from 'myst-common';
import type { VFile } from 'vfile';
import { parse } from 'csv-parse/sync';

export const tableDirective: DirectiveSpec = {
  name: 'table',
  arg: {
    type: 'myst',
  },
  options: {
    label: {
      type: String,
      alias: ['name'],
    },
    class: {
      type: String,
      // class_option: list of strings?
      doc: `CSS classes to add to your table. Special classes include:

- \`full-width\`: changes the table environment to cover two columns in LaTeX`,
    },
    align: {
      type: String,
      // choice(['left', 'center', 'right'])
    },
  },
  body: {
    type: 'myst',
    required: true,
  },
  run(data): GenericNode[] {
    const children = [];
    if (data.arg) {
      children.push({
        type: 'caption',
        children: [{ type: 'paragraph', children: data.arg as GenericNode[] }],
      });
    }
    children.push(...(data.body as GenericNode[]));
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    const container = {
      type: 'container',
      kind: 'table',
      identifier,
      label,
      class: data.options?.class,
      children,
    };
    return [container];
  },
};

export const listTableDirective: DirectiveSpec = {
  name: 'list-table',
  arg: {
    type: 'myst',
  },
  options: {
    label: {
      type: String,
      alias: ['name'],
    },
    'header-rows': {
      type: Number,
      // nonnegative int
    },
    // 'stub-columns': {
    //   type: Number,
    //   // nonnegative int
    // },
    // width: {
    //   type: String,
    //   // length_or_percentage_or_unitless,
    // },
    // widths: {
    //   type: String,
    //   // TODO use correct widths option validator
    // },
    class: {
      type: String,
      // class_option: list of strings?
      doc: `CSS classes to add to your table. Special classes include:

- \`full-width\`: changes the table environment to cover two columns in LaTeX`,
    },
    align: {
      type: String,
      // choice(['left', 'center', 'right'])
    },
  },
  body: {
    type: 'myst',
    required: true,
  },
  validate(data: DirectiveData, vfile: VFile) {
    const validatedData = { ...data };
    const parsedBody = data.body as GenericNode[];
    if (parsedBody.length !== 1 || parsedBody[0].type !== 'list') {
      fileError(vfile, 'list-table directive must have one list as body', {
        node: data.node,
        ruleId: RuleId.directiveBodyCorrect,
      });
      validatedData.body = [];
    } else {
      parsedBody[0].children?.forEach((listItem) => {
        if (!(validatedData.body as GenericNode[]).length) return;
        if (
          listItem.type !== 'listItem' ||
          listItem.children?.length !== 1 ||
          listItem.children[0]?.type !== 'list'
        ) {
          fileError(vfile, 'list-table directive must have a list of lists', {
            node: data.node,
            ruleId: RuleId.directiveBodyCorrect,
          });
          validatedData.body = [];
        }
      });
    }
    return validatedData;
  },
  run(data: DirectiveData): GenericNode[] {
    const children = [];
    if (data.arg) {
      children.push({
        type: 'caption',
        children: [{ type: 'paragraph', children: data.arg as GenericNode[] }],
      });
    }
    const topListChildren = (data.body as GenericNode[])[0]?.children || [];
    let headerCount = (data.options?.['header-rows'] as number) || 0;
    const table = {
      type: 'table',
      align: data.options?.align,
      children: topListChildren.map((topListItem) => {
        const nestedListChildren = topListItem.children?.[0]?.children || [];
        const row = {
          type: 'tableRow',
          children: nestedListChildren.map((nestedListItem) => {
            const cell = {
              type: 'tableCell',
              header: headerCount > 0 ? true : undefined,
              children: nestedListItem.children,
            };
            return cell;
          }),
        };
        headerCount -= 1;
        return row;
      }),
    };
    children.push(table);
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    const container = {
      type: 'container',
      kind: 'table',
      identifier,
      label,
      class: data.options?.class,
      children,
    };
    return [container];
  },
};

function parseCSV(
  data: string,
  opts: DirectiveData['options'] | undefined,
  ctx: DirectiveContext,
): GenericParent[][] {
  const delimiter = (opts?.delimiter ?? ',') as string;
  const records = parse(data, {
    delimiter,
    ltrim: !opts?.keepspace,
    escape: (opts?.escape ?? delimiter) as string,
    quote: (opts?.quote ?? '"') as string,
  });

  return records.map((record: any, recordIndex: number) => {
    return record.map((cell: string) => {
      const rawResult = ctx.parseMyst(cell, recordIndex);
      if (rawResult.type !== 'root') {
        throw new Error(`Expected a root element from parsing MyST: ${cell}`);
      }
      const { children: rawCells } = rawResult;
      if (!(rawCells.length === 1 && rawCells[0].type === 'paragraph')) {
        throw new Error(`Expected a single paragraph node, encountered ${rawCells[0].type}`);
      }
      return rawCells[0];
    });
  });
}

export const csvTableDirective: DirectiveSpec = {
  name: 'csv-table',
  arg: {
    type: 'myst',
  },
  options: {
    label: {
      type: String,
      alias: ['name'],
    },
    header: {
      type: String,
      // nonnegative int
    },

    'header-rows': {
      type: Number,
      // nonnegative int
    },
    class: {
      type: String,
      // class_option: list of strings?
      doc: `CSS classes to add to your table. Special classes include:

- \`full-width\`: changes the table environment to cover two columns in LaTeX`,
    },
    align: {
      type: String,
      // choice(['left', 'center', 'right'])
    },
    delim: {
      type: String,
    },
    escape: {
      type: String,
    },
    keepspace: {
      type: Boolean,
    },
    quote: {
      type: String,
    },
  },
  body: {
    type: String,
    required: true,
  },
  run(data: DirectiveData, vfile: VFile, ctx: DirectiveContext): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};

    const rows: GenericParent[] = [];

    if (data.options?.header !== undefined) {
      const headerCells = parseCSV(data.options.header as string, data.options, ctx);
      rows.push(
        ...headerCells.map((parsedRow) => ({
          type: 'tableRow',
          children: parsedRow.map((parsedCell) => ({
            type: 'tableCell',
            header: true,
            children: parsedCell.children,
          })),
        })),
      );
    }
    const cells = parseCSV(data.body as string, data.options, ctx);

    let headerCount = (data.options?.['header-rows'] as number) || 0;
    rows.push(
      ...cells.map((parsedRow) => {
        const row = {
          type: 'tableRow',
          children: parsedRow.map((parsedCell) => ({
            type: 'tableCell',
            header: headerCount > 0 ? true : undefined,
            children: parsedCell.children,
          })),
        };

        headerCount -= 1;
        return row;
      }),
    );
    const table = {
      type: 'table',
      align: data.options?.align,
      children: rows,
    };
    const container = {
      type: 'container',
      kind: 'table',
      identifier: identifier,
      label: label,
      class: data.options?.class,
      children: [...(data.arg as GenericNode[]), table],
    };

    return [container];
  },
};
