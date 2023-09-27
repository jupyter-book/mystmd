import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';

export const mdastDirective: DirectiveSpec = {
  name: 'mdast',
  arg: {
    type: String,
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'mdast',
        id: data.arg as string,
      },
    ];
  },
};
