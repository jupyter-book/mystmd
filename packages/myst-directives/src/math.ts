import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { normalizeLabel } from 'myst-common';

export const mathDirective: DirectiveSpec = {
  name: 'math',
  options: {
    label: {
      type: String,
      alias: ['name'],
    },
  },
  body: {
    type: String,
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
