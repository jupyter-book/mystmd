import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const marginDirective: DirectiveSpec = {
  name: 'margin',
  body: {
    type: ParseTypesEnum.parsed,
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
