import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import type { Aside } from 'myst-spec-ext';
import type { FlowContent, ListContent, PhrasingContent } from 'myst-spec';
import { addCommonDirectiveOptions, commonDirectiveOptions } from './utils.js';

export const asideDirective: DirectiveSpec = {
  name: 'aside',
  doc: 'Asides provide an easy way to represent content that is only indirectly related to the article\'s main content. Where supported, MyST will attempt to display an aside as close as possible but separately from the main article, such as in the side-margin. See [](#directive:aside).',
  alias: ['margin', 'sidebar', 'topic'],
  arg: {
    type: 'myst',
    doc: 'An optional title',
  },
  options: {
    ...commonDirectiveOptions('aside'),
  },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    const children = [...(data.body as unknown as (FlowContent | ListContent | PhrasingContent)[])];
    if (data.arg) {
      children.unshift({
        type: 'admonitionTitle',
        children: data.arg,
      } as any);
    }
    const aside: Aside = {
      type: 'aside',
      kind:
        data.name == 'aside' || data.name == 'margin' ? undefined : (data.name as Aside['kind']),
      children,
    };
    addCommonDirectiveOptions(data, aside);
    return [aside];
  },
};
