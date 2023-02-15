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
    // name: {
    //   type: ParseTypesEnum.string,
    // },
    class: {
      type: ParseTypesEnum.string,
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
      children.push({
        type: 'admonitionTitle',
        children: data.arg as GenericNode[],
      });
    }
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }
    const admonition = {
      type: 'admonition',
      kind: data.name !== 'admonition' ? data.name.replace('.callout-', '') : 'admonition',
      class: data.options?.class,
      children,
    };
    return [admonition];
  },
};
