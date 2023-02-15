import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const gridDirective: DirectiveSpec = {
  name: 'grid',
  arg: {
    type: ParseTypesEnum.string,
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
    type: ParseTypesEnum.parsed,
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

function getColumns(columnString?: string) {
  const columns = (columnString ?? '1 2 2 3')
    .split(/\s/)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n))
    .map((n) => Math.min(Math.max(Math.floor(n), 1), 12)); // Integer between 1 and 12
  if (columns.length === 0 || columns.length > 4) return [1, 2, 2, 3];
  return columns;
}
