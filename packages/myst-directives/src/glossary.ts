import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';

export const glossaryDirective: DirectiveSpec = {
  name: 'glossary',
  body: {
    type: 'myst',
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
