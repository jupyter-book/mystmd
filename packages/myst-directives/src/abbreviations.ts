import type { DirectiveData, DirectiveSpec, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const abbreviationsDirective: DirectiveSpec = {
  name: 'abbreviations',
  doc: 'Inserts a list of known abbreviations in the page.',
  arg: {
    type: 'myst',
    doc: 'Heading to be included with the abbreviations list',
  },
  options: {
    ...commonDirectiveOptions('abbreviations'),
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.arg) {
      const parsedArg = data.arg as GenericNode[];
      if (parsedArg[0]?.type === 'heading') {
        children.push(...parsedArg);
      } else {
        children.push({
          type: 'heading',
          depth: 2,
          enumerated: false,
          children: parsedArg,
        });
      }
    }
    const abbreviations = { type: 'abbreviations', children };
    addCommonDirectiveOptions(data, abbreviations);
    return [abbreviations];
  },
};
