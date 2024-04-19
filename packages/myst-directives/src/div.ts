import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import type { FlowContent, ListContent, PhrasingContent } from 'myst-spec';
import { normalizeLabel } from 'myst-common';

export const divDirective: DirectiveSpec = {
  name: 'div',
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
    const div: GenericNode = {
      type: 'div',
      children: data.body as unknown as (FlowContent | ListContent | PhrasingContent)[],
      class: data.options?.class as string | undefined,
      label,
      identifier,
    };
    return [div];
  },
};
