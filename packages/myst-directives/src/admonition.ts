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
      children.push({
        type: data.body ? 'admonitionTitle' : 'paragraph',
        children: data.arg as GenericNode[],
      });
    }
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }
    const admonition = {
      type: 'admonition',
      kind: data.name !== 'admonition' ? data.name : undefined,
      class: data.options?.class,
      children,
    };
    return [admonition];
  },
};
