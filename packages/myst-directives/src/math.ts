import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const mathDirective: DirectiveSpec = {
  name: 'math',
  options: {
    ...commonDirectiveOptions('math'),
  },
  body: {
    type: String,
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    const math = addCommonDirectiveOptions(data, { type: 'math', value: data.body as string });
    if (data.node.tight) {
      // The default `false` is not written to the AST
      math.tight = data.node.tight;
    }
    return [math];
  },
};
