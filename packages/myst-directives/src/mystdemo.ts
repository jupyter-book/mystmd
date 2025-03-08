import yaml from 'js-yaml';
import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const mystdemoDirective: DirectiveSpec = {
  name: 'myst',
  options: {
    ...commonDirectiveOptions('myst'),
    numbering: {
      type: String,
    },
  },
  body: {
    type: String,
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    let numbering: any;
    if (data.options?.numbering) {
      try {
        numbering = yaml.load(data.options.numbering as string);
      } catch (err) {
        //pass
      }
    }
    const myst = {
      type: 'myst',
      numbering,
      value: data.body as string,
    };
    addCommonDirectiveOptions(data, myst);
    return [myst];
  },
};
