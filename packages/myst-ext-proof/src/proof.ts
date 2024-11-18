import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from 'myst-directives';

export const proofDirective: DirectiveSpec = {
  name: 'proof',
  alias: [
    'prf:proof',
    'prf:theorem',
    'prf:axiom',
    'prf:lemma',
    'prf:definition',
    'prf:criterion',
    'prf:remark',
    'prf:conjecture',
    'prf:corollary',
    'prf:algorithm',
    'prf:example',
    'prf:property',
    'prf:observation',
    'prf:proposition',
    'prf:assumption',
  ],
  arg: {
    type: 'myst',
  },
  options: {
    ...commonDirectiveOptions('proof'),
    nonumber: {
      type: Boolean,
    },
  },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: DirectiveData): GenericNode[] {
    const children: GenericNode[] = [];
    if (data.arg) {
      children.push({
        type: 'admonitionTitle',
        children: data.arg as GenericNode[],
      });
    }
    if (data.body) {
      children.push(...(data.body as GenericNode[]));
    }
    const nonumber = (data.options?.nonumber as boolean) ?? false;
    const proof = {
      type: 'proof',
      kind: data.name !== 'proof' ? data.name.replace('prf:', '') : undefined,
      enumerated: !nonumber,
      children: children as any[],
    };
    addCommonDirectiveOptions(data, proof);
    return [proof];
  },
};
