import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const mermaidDirective: DirectiveSpec = {
  name: 'mermaid',
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
