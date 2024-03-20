import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';

export const sidebarDirective: DirectiveSpec = {
  name: 'sidebar',
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'sidebar',
        children: data.body as GenericNode[],
      },
    ];
  },
};
