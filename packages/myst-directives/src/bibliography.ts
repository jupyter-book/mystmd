import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';

export const bibliographyDirective: DirectiveSpec = {
  name: 'bibliography',
  options: {
    filter: {
      type: String,
    },
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'bibliography',
        filter: data.options?.filter,
      },
    ];
  },
};
