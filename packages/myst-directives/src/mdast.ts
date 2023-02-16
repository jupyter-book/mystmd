import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const mdastDirective: DirectiveSpec = {
  name: 'mdast',
  arg: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'mdast',
        id: data.arg as string,
      },
    ];
  },
};
