/**
 * Reference key is used as a prefix in link syntax, e.g. `key:my#reference`
 *
 * Therefore, common protocols and existing prefixes from link transforms
 * must be avoided. Note: You can still override the behavior of these
 * protocols with custom LinkTransforms.
 */
export const RESERVED_REFERENCE_KEYS = [
  // Web protocols
  'http',
  'https',
  'ftp',
  'mailto',
  // Protocols for built-in link transformers
  'myst',
  'file',
  'doi',
  'github',
  'sphinx',
  'rrid',
  'wiki',
];

export const KNOWN_REFERENCE_KINDS = ['myst', 'intersphinx'];

export type ExternalReference = {
  url: string;
  kind?: string;
};

export type ExternalReferences = Record<string, ExternalReference>;
