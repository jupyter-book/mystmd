import type Token from 'markdown-it/lib/token';

export type { Token };

export type GenericText = {
  type: string;
  value: string;
};

export type GenericNode<T extends Record<string, any> = Record<string, any>> = {
  type: string;
  kind?: string;
  children?: GenericNode<Record<string, any>>[];
  value?: string;
  identifier?: string;
  label?: string;
} & T;

export type GenericParent<T extends Record<string, any> = Record<string, any>> =
  GenericNode<T> & { children: GenericNode<T>[] };

export type Spec = {
  type: string;
  getAttrs?: (token: Token, tokens: Token[], index: number) => Record<string, any>;
  attrs?: Record<string, any>;
  noCloseToken?: boolean;
  isText?: boolean;
  isLeaf?: boolean;
};

export type Admonition = GenericNode<{
  kind?: AdmonitionKind;
  class?: string;
}>;

export type Container = {
  kind: string;
  identifier?: string;
  label?: string;
  class?: string;
  numbered?: boolean;
};

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
