import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const mathDirective: DirectiveSpec = {
  name: 'math',
  options: {
    ...commonDirectiveOptions('math'),
    typst: {
      type: String,
      doc: 'Typst-specific math content. If not provided, LaTeX content will be converted to Typst.',
    },
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
    if (data.options?.typst) {
      math.typst = data.options.typst as string;
    }
    return [math];
  },
};
