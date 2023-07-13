import type { DirectiveSpec, DirectiveData } from 'myst-common';
import { normalizeLabel, ParseTypesEnum } from 'myst-common';
import type { Embed } from 'myst-spec-ext';

export const embedDirective: DirectiveSpec = {
  name: 'embed',
  arg: {
    type: ParseTypesEnum.string,
    required: true,
  },
  options: {
    'remove-input': {
      type: ParseTypesEnum.boolean,
    },
    'remove-output': {
      type: ParseTypesEnum.boolean,
    },
  },
  run(data: DirectiveData): Embed[] {
    if (!data.arg) return [];
    const argString = data.arg as string;
    const arg = argString.startsWith('#') ? argString.substring(1) : argString;
    const { label } = normalizeLabel(arg) || {};
    if (!label) return [];
    return [
      {
        type: 'embed',
        source: { label },
        'remove-input': data.options?.['remove-input'] as boolean | undefined,
        'remove-output': data.options?.['remove-output'] as boolean | undefined,
      },
    ];
  },
};
