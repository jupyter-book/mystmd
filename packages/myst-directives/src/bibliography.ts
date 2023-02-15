import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const bibliographyDirective: DirectiveSpec = {
  name: 'bibliography',
  options: {
    filter: {
      type: ParseTypesEnum.string,
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
