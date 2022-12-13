import type { Root } from 'mdast';
import type { FootnoteDefinition, Node } from 'myst-spec';

export type GenericNode<T extends Record<string, any> = Record<string, any>> = {
  type: string;
  kind?: string;
  children?: GenericNode<Record<string, any>>[];
  value?: string;
  identifier?: string;
  label?: string;
  position?: Node['position'];
} & T;

export type GenericParent<T extends Record<string, any> = Record<string, any>> = GenericNode<T> & {
  children: GenericNode<T>[];
};

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
