import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from 'myst-directives';

export const tabSetDirective: DirectiveSpec = {
  name: 'tab-set',
  alias: ['tabSet'],
  options: {
    ...commonDirectiveOptions('tab-set'),
  },
  body: {
    type: 'myst',
  },
  run(data: DirectiveData): GenericNode[] {
    const tabSet = {
      type: 'tabSet',
      children: (data.body || []) as GenericNode[],
    };
    addCommonDirectiveOptions(data, tabSet);
    return [tabSet];
  },
};

export const tabItemDirective: DirectiveSpec = {
  name: 'tab-item',
  alias: ['tabItem', 'tab'], // TODO: A transform is necessary for stray `tab`s
  arg: {
    type: String,
  },
  options: {
    ...commonDirectiveOptions('tab-item'),
    sync: {
      type: String,
    },
    selected: {
      type: Boolean,
    },
  },
  body: {
    type: 'myst',
  },
  run(data: DirectiveData): GenericNode[] {
    const tabItem = {
      type: 'tabItem',
      title: data.arg ?? 'Tab Title',
      sync: data.options?.sync,
      selected: data.options?.selected,
      children: (data.body || []) as GenericNode[],
    };
    addCommonDirectiveOptions(data, tabItem);
    return [tabItem];
  },
};

//   tabItemHastHandler: (h, node) => h(node, 'div', { class: 'margin' }),
//   tabSetHastHandler: (h, node) => h(node, 'div', { class: 'margin' }),

export const tabDirectives = [tabSetDirective, tabItemDirective];
