import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const dropdownDirective: DirectiveSpec = {
  name: 'dropdown',
  doc: 'Dropdowns can be used to toggle content and show it only when a user clicks on the header panel. These use the standard HTML <details> element. See [](#dropdowns).',
  arg: {
    type: 'myst',
  },
  options: {
    ...commonDirectiveOptions('dropdown'),
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
