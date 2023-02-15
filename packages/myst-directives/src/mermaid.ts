import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const mermaidDirective: DirectiveSpec = {
  name: 'mermaid',
  body: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'mermaid',
        value: data.body as string,
      },
    ];
  },
};
