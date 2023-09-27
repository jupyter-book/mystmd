import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';

export const marginDirective: DirectiveSpec = {
  name: 'margin',
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'margin',
        children: data.body as GenericNode[],
      },
    ];
  },
};
