import type { Admonition } from 'myst-spec-ext';
import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const admonitionDirective: DirectiveSpec = {
  name: 'admonition',
  alias: [
    'attention',
    'caution',
    'danger',
    'error',
    'important',
    'hint',
    'note',
    'seealso',
    'tip',
    'warning',
    '.callout-note',
    '.callout-warning',
    '.callout-important',
    '.callout-tip',
    '.callout-caution',
  ],
  arg: {
    type: ParseTypesEnum.parsed,
  },
  options: {
    // label: {
    //   type: ParseTypesEnum.string,
    //   alias: ['name'],
    // },
    class: {
      type: ParseTypesEnum.string,
      // class_option: list of strings?
    },
    icon: {
      type: ParseTypesEnum.boolean,
      // class_option: list of strings?
    },
  },
  body: {
    type: ParseTypesEnum.parsed,
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.arg) {
      // TODO: We should potentially raise a compatibility warning here with the python side
      // TODO: We should have this ALWAYS be admonition title.
      children.push({
        type: data.body ? 'admonitionTitle' : 'paragraph',
        children: data.arg as GenericNode[],
      });
    }
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }
    const admonition: Admonition = {
      type: 'admonition',
      kind:
        data.name !== 'admonition'
          ? (data.name.replace('.callout-', '') as Admonition['kind'])
          : undefined,
      class: data.options?.class as string,
      children: children as any[],
    };
    if (data.options?.icon === false) {
      admonition.icon = false;
    }
    return [admonition];
  },
};
