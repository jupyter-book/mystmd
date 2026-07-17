import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const bibliographyDirective: DirectiveSpec = {
  name: 'bibliography',
  options: {
    ...commonDirectiveOptions('bibliography'),
    filter: {
      type: String,
    },
  },
  run(data: DirectiveData): GenericNode[] {
    const bibliography = {
      type: 'bibliography',
      filter: data.options?.filter,
    };
    addCommonDirectiveOptions(data, bibliography);
    return [bibliography];
  },
};
