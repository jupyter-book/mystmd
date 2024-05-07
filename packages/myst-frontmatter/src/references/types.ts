export const KNOWN_REFERENCE_KINDS = ['myst', 'intersphinx'];

export type ExternalReference = {
  url: string;
  kind?: string;
};

export type ExternalReferences = Record<string, ExternalReference>;
