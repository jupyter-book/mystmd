import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import type { Aside } from 'myst-spec-ext';
import type { FlowContent, ListContent, PhrasingContent } from 'myst-spec';
import { normalizeLabel } from 'myst-common';

export const asideDirective: DirectiveSpec = {
  name: 'aside',
  alias: ['margin', 'sidebar', 'topic'],
  arg: {
    type: 'myst',
    doc: 'An optional title',
  },
  options: {
    label: {
      type: String,
      alias: ['name'],
    },
    class: {
      type: String,
    },
  },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    const { label, identifier } = normalizeLabel(data.options?.label as string | undefined) || {};
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
      class: data.options?.class as string | undefined,
      label,
      identifier,
    };
    return [aside];
  },
};
