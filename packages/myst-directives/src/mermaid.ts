import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';

export const mermaidDirective: DirectiveSpec = {
  name: 'mermaid',
  body: {
    type: String,
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
