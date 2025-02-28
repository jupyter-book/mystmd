import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const tocDirective: DirectiveSpec = {
  name: 'toc',
  alias: ['tableofcontents', 'table-of-contents'],
  arg: {
    type: 'myst',
    doc: 'Heading to be included with table of contents',
  },
  options: {
    ...commonDirectiveOptions('toc'),
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
          depth: 1,
          children: parsedArg,
        });
      }
    }
    const toc = { type: 'toc', children };
    addCommonDirectiveOptions(data, toc);
    return [toc];
  },
};
