import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const includeDirective: DirectiveSpec = {
  name: 'include',
  arg: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'include',
        file: data.arg as string,
      },
    ];
  },
};
