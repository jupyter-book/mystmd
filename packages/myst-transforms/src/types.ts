import type { Root } from 'mdast';
import type { FootnoteDefinition } from 'myst-spec';

// TODO: move this to myst-spec
export enum AdmonitionKind {
  admonition = 'admonition',
  attention = 'attention',
  caution = 'caution',
  danger = 'danger',
  error = 'error',
  important = 'important',
  hint = 'hint',
  note = 'note',
  seealso = 'seealso',
  tip = 'tip',
  warning = 'warning',
}

export type Citations = {
  order: string[];
  data: Record<string, { html: string; number: number; doi: string | undefined }>;
};

export type Footnotes = Record<string, FootnoteDefinition>;

export type References = {
  cite?: Citations;
  footnotes?: Footnotes;
  article?: Root;
};
