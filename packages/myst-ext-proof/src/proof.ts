import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { normalizeLabel, ParseTypesEnum } from 'myst-common';

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
    type: ParseTypesEnum.parsed,
  },
  options: {
    label: {
      type: ParseTypesEnum.string,
    },
    class: {
      type: ParseTypesEnum.string,
    },
    nonumber: {
      type: ParseTypesEnum.boolean,
    },
  },
  body: {
    type: ParseTypesEnum.parsed,
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
    const rawLabel = data.options?.label as string;
    const { label, identifier } = normalizeLabel(rawLabel) || {};
    const proof = {
      type: 'proof',
      kind: data.name !== 'proof' ? data.name.replace('prf:', '') : undefined,
      label,
      identifier,
      class: data.options?.class as string,
      enumerated: !nonumber,
      children: children as any[],
    };
    return [proof];
  },
};
