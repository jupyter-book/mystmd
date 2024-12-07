import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const mdastDirective: DirectiveSpec = {
  name: 'mdast',
  arg: {
    type: String,
    required: true,
  },
  options: {
    ...commonDirectiveOptions('mdast'),
  },
  run(data: DirectiveData): GenericNode[] {
    const mdast = {
      type: 'mdast',
      id: data.arg as string,
    };
    addCommonDirectiveOptions(data, mdast);
    return [mdast];
  },
};
