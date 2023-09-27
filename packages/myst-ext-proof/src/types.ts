import type { Container } from 'myst-spec';

const PROOF_KINDS = [
  'proof',
  'axiom',
  'lemma',
  'definition',
  'criterion',
  'remark',
  'conjecture',
  'corollary',
  'algorithm',
  'example',
  'property',
  'observation',
  'proposition',
  'assumption',
  'theorem',
] as const;
type ProofKinds = typeof PROOF_KINDS;

export type ProofKind = ProofKinds[number];

export type ProofContainer = Omit<Container, 'kind'> & {
  kind: ProofKind;
};
