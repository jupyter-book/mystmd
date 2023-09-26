import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const tabSetDirective: DirectiveSpec = {
  name: 'tab-set',
  alias: ['tabSet'],
  options: {
    class: {
      type: ParseTypesEnum.string,
    },
  },
  body: {
    type: ParseTypesEnum.parsed,
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
  alias: ['tabItem'],
  arg: {
    type: ParseTypesEnum.string,
  },
  options: {
    sync: {
      type: ParseTypesEnum.string,
    },
    selected: {
      type: ParseTypesEnum.boolean,
    },
  },
  body: {
    type: ParseTypesEnum.parsed,
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
