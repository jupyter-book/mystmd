import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const mermaidDirective: DirectiveSpec = {
  name: 'mermaid',
  doc: 'It is possible to add mermaid diagrams using the mermaid directive. See [](#directive:mermaid).',
  options: {
    ...commonDirectiveOptions('mermaid'),
  },
  body: {
    type: String,
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      addCommonDirectiveOptions(data, {
        type: 'mermaid',
        value: data.body as string,
      }),
    ];
  },
};
