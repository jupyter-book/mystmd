import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const glossaryDirective: DirectiveSpec = {
  name: 'glossary',
  body: {
    type: ParseTypesEnum.parsed,
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'glossary',
        children: data.body as GenericNode[],
      },
    ];
  },
};
