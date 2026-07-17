import type { DirectiveSpec, DirectiveData, GenericNode } from 'myst-common';
import { addCommonDirectiveOptions, commonDirectiveOptions } from 'myst-directives';
import { PROOF_KINDS } from './types.js';

// e.g. 'prf:theorem' (legacy, kept for backward compatibility) and 'proof:theorem' (preferred)
const KIND_ALIASES = PROOF_KINDS.flatMap((kind) => [`prf:${kind}`, `proof:${kind}`]);

export const proofDirective: DirectiveSpec = {
  name: 'proof',
  alias: KIND_ALIASES,
  arg: {
    type: 'myst',
  },
  options: {
    ...commonDirectiveOptions('proof'),
    nonumber: {
      type: Boolean,
      doc: 'Legacy flag to disable numbering of proofs; equivalent to `enumerated: false`',
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

    // Let `nonumber` take precedence over enumerated
    let enumerated: boolean;
    if (data.options?.nonumber !== undefined) {
      enumerated = !data.options.nonumber as boolean;
    } else {
      enumerated = (data.options?.enumerated as boolean) ?? true;
    }
    const proof = {
      type: 'proof',
      kind: data.name !== 'proof' ? data.name.replace(/^(prf|proof):/, '') : undefined,
      enumerated,
      children: children as any[],
    };
    addCommonDirectiveOptions(data, proof);
    return [proof];
  },
};
