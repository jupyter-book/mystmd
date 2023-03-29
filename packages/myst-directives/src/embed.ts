import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { normalizeLabel, ParseTypesEnum } from 'myst-common';

export const embedDirective: DirectiveSpec = {
  name: 'embed',
  options: {
    label: {
      type: ParseTypesEnum.string,
      required: true,
    },
    'remove-input': {
      type: ParseTypesEnum.boolean,
    },
    'remove-output': {
      type: ParseTypesEnum.boolean,
    },
  },
  run(data: DirectiveData): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.label as string) || {};
    return [
      {
        type: 'embed',
        label,
        identifier,
        'remove-input': data.options?.['remove-input'],
        'remove-output': data.options?.['remove-output'],
      },
    ];
  },
};
