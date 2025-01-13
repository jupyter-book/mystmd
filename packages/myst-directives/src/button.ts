import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import type { Link } from 'myst-spec-ext';
import { addClassOptions, classDirectiveOption } from './utils.js';

export const buttonDirective: DirectiveSpec = {
  name: 'button',
  doc: 'Button to navigate to external or internal links.',
  arg: {
    type: String,
    doc: 'Target link of the button.',
    required: true,
  },
  options: {
    ...classDirectiveOption('button'),
  },
  body: {
        type: 'myst',
        doc: 'The body of the button.',
        required: false,
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.body) {
      children.push(...data.body as GenericNode[]);
    }
    const node: Link = {
      type: 'link',
      kind: 'button',
      url: data.arg as string,
      children: children as any[],
  };
    addClassOptions(data, node)
    return [
      node
    ];
  },
};
