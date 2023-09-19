import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { normalizeLabel, ParseTypesEnum } from 'myst-common';

export const mathDirective: DirectiveSpec = {
  name: 'math',
  options: {
    label: {
      type: ParseTypesEnum.string,
      alias: ['name'],
    },
  },
  body: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
    return [
      {
        type: 'math',
        identifier,
        label,
        value: data.body as string,
      },
    ];
  },
};
