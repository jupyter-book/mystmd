import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';

export const tabSetDirective: DirectiveSpec = {
  name: 'tab-set',
  alias: ['tabSet'],
  options: {
    class: {
      type: String,
    },
  },
  body: {
    type: 'myst',
  },
  run(data: DirectiveData): GenericNode[] {
    return [
      {
        type: 'tabSet',
        class: data.options?.class,
        children: (data.body || []) as GenericNode[],
      },
    ];
  },
};

export const tabItemDirective: DirectiveSpec = {
  name: 'tab-item',
  alias: ['tabItem', 'tab'], // TODO: A transform is necessary for stray `tab`s
  arg: {
    type: String,
  },
  options: {
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
    return [
      {
        type: 'tabItem',
        title: data.arg ?? 'Tab Title',
        sync: data.options?.sync,
        selected: data.options?.selected,
        children: (data.body || []) as GenericNode[],
      },
    ];
  },
};

//   tabItemHastHandler: (h, node) => h(node, 'div', { class: 'margin' }),
//   tabSetHastHandler: (h, node) => h(node, 'div', { class: 'margin' }),

export const tabDirectives = [tabSetDirective, tabItemDirective];
