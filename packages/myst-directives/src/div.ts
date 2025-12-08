import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import type { FlowContent, ListContent, PhrasingContent } from 'myst-spec';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const divDirective: DirectiveSpec = {
  name: 'div',
  options: {
    ...commonDirectiveOptions('div'),
  },
  body: {
    type: 'myst',
  },
  run(data: DirectiveData): GenericNode[] {
    const div: GenericNode = { type: 'div' };
    if (data.body) {
      div.children = data.body as unknown as (FlowContent | ListContent | PhrasingContent)[];
    }
    addCommonDirectiveOptions(data, div);
    return [div];
  },
};
