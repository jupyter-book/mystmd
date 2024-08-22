import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, labelDirectiveOption } from './utils.js';

export const dropdownDirective: DirectiveSpec = {
  name: 'dropdown',
  arg: {
    type: 'myst',
  },
  options: {
    ...labelDirectiveOption('dropdown'),
    // TODO: Add enumeration in future
    open: {
      type: Boolean,
      doc: 'When true, the dropdown starts open.',
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
    const details = {
      type: 'details',
      open: data.options?.open,
      children,
    };
    addCommonDirectiveOptions(data, details);
    return [details];
  },
};
