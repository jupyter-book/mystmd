import {
  type DirectiveSpec,
  type DirectiveData,
  type GenericNode,
  normalizeLabel,
} from 'myst-common';

function getColumns(columnString?: string) {
  const columns = (columnString ?? '1 2 2 3')
    .split(/\s/)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n))
    .map((n) => Math.min(Math.max(Math.floor(n), 1), 12)); // Integer between 1 and 12
  if (columns.length === 0 || columns.length > 4) return [1, 2, 2, 3];
  return columns;
}

export const gridDirective: DirectiveSpec = {
  name: 'grid',
  arg: {
    type: String,
  },
  // options:
  // // https://sphinx-design.readthedocs.io/en/furo-theme/grids.html#grid-options
  // 'class-container'
  // 'class-row'
  // gutter
  // margin
  // padding
  // reverse
  // outline
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'grid',
        columns: getColumns(data.arg as string | undefined),
        children: data.body as GenericNode[],
      },
    ];
  },
};

export const gridItemDirective: DirectiveSpec = {
  name: 'grid-item',
  options: {
    label: {
      type: String,
      alias: ['name'],
    },
    class: {
      type: String,
    },
  },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    const div: GenericNode = {
      type: 'div',
      children: data.body as unknown as GenericNode[],
      class: data.options?.class as string | undefined,
      label,
      identifier,
    };
    return [div];
  },
};

export const gridDirectives = [gridDirective, gridItemDirective];
