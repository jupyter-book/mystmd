import { load as loadYAML } from 'js-yaml';
import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const mystdemoDirective: DirectiveSpec = {
  name: 'myst',
  doc: 'Demonstrate some MyST code in an editable code block that displays its output/result interactively. Limited to built-in functionality, as parsing and rendering is done in the browser without access to plugin code or project configuration.',
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
        numbering = loadYAML(data.options.numbering as string);
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
