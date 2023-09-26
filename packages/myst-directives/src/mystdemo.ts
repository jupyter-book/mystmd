import yaml from 'js-yaml';
import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';

export const mystdemoDirective: DirectiveSpec = {
  name: 'myst',
  options: {
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
    return [
      {
        type: 'myst',
        numbering,
        value: data.body as string,
      },
    ];
  },
};
