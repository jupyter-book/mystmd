import type { DirectiveSpec, DirectiveData } from 'myst-common';
import { normalizeLabel } from 'myst-common';
import type { Embed } from 'myst-spec-ext';

export const embedDirective: DirectiveSpec = {
  name: 'embed',
  doc: 'The embed directive allows you to duplicate content from another part of your project. This can also be done through the figure directive.',
  arg: {
    type: String,
    doc: 'The label of the node that you are embedding.',
    required: true,
  },
  options: {
    'remove-input': {
      type: Boolean,
    },
    'remove-output': {
      type: Boolean,
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
