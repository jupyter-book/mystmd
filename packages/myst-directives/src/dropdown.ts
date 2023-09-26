import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';

export const dropdownDirective: DirectiveSpec = {
  name: 'dropdown',
  arg: {
    type: 'myst',
  },
  options: {
    open: {
      type: Boolean,
    },
    // Legacy options we may want to implement:
    // color
    // icon
    // animate
    // margin
    // name
    // 'class-container'
    // 'class-title'
    // 'class-body'
  },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.arg) {
      children.push({ type: 'summary', children: data.arg as GenericNode[] });
    }
    children.push(...(data.body as GenericNode[]));
    return [
      {
        type: 'details',
        open: data.options?.open,
        children,
      },
    ];
  },
};
