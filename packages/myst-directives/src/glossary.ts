import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const glossaryDirective: DirectiveSpec = {
  name: 'glossary',
  body: {
    type: 'myst',
    required: true,
  },
  options: {
    ...commonDirectiveOptions('glossary'),
  },
  run(data: DirectiveData): GenericNode[] {
    const glossary = {
      type: 'glossary',
      children: data.body as GenericNode[],
    };
    addCommonDirectiveOptions(data, glossary);
    return [glossary];
  },
};
