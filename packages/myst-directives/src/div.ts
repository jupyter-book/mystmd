import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import type { FlowContent, ListContent, PhrasingContent } from 'myst-spec';
import { addCommonDirectiveOptions, labelDirectiveOption } from './utils.js';

export const divDirective: DirectiveSpec = {
  name: 'div',
  options: {
    ...labelDirectiveOption('div'),
    // TODO: Add enumeration in future
    class: {
      type: String,
    },
  },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    const div: GenericNode = {
      type: 'div',
      class: data.options?.class as string | undefined,
      children: data.body as unknown as (FlowContent | ListContent | PhrasingContent)[],
    };
    addCommonDirectiveOptions(data, div);
    return [div];
  },
};
