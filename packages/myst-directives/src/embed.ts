import type { DirectiveSpec, DirectiveData } from 'myst-common';
import { fileError, fileWarn, normalizeLabel, ParseTypesEnum } from 'myst-common';
import type { Embed } from 'myst-spec-ext';
import type { VFile } from 'vfile';

export const embedDirective: DirectiveSpec = {
  name: 'embed',
  arg: {
    type: ParseTypesEnum.string,
  },
  options: {
    label: {
      type: ParseTypesEnum.string,
    },
    'remove-input': {
      type: ParseTypesEnum.boolean,
    },
    'remove-output': {
      type: ParseTypesEnum.boolean,
    },
  },
  validate(data: DirectiveData, vfile: VFile) {
    const validatedData = { ...data };
    const { arg, options } = data;
    const { label } = options ?? {};
    if (arg && label) {
      fileWarn(vfile, `embed directive option label "${label}" ignored, using argument "${arg}"`);
    } else if (label && !arg) {
      fileWarn(vfile, `embed directive label should be provided as argument, not option: ${label}`);
      validatedData.arg = `#${label}`;
    } else if (!label && !arg) {
      fileError(vfile, 'required argument not provided for directive: embed');
    }
    return validatedData;
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
        label,
        'remove-input': !!data.options?.['remove-input'],
        'remove-output': !!data.options?.['remove-output'],
      },
    ];
  },
};
