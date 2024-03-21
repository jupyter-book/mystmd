import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import type { Aside } from 'myst-spec-ext';
import type { FlowContent, ListContent, PhrasingContent } from 'myst-spec';

export const asideDirective: DirectiveSpec = {
  name: 'aside',
  alias: ['margin', 'sidebar'],
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    const aside: Aside = {
      type: 'aside',
      kind:
        data.name == 'aside' || data.name == 'margin' ? undefined : (data.name as Aside['kind']),
      children: data.body as (FlowContent | ListContent | PhrasingContent)[],
    };
    return [aside];
  },
};
