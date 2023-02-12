import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import type { DirectiveSpec, RoleSpec } from 'myst-common';
import type { MathExtensionOptions } from './plugins';
import type { MdastOptions } from './tokensToMyst';

export type TokenHandlerSpec = {
  type: string;
  getAttrs?: (token: Token, tokens: Token[], index: number) => Record<string, any>;
  attrs?: Record<string, any>;
  noCloseToken?: boolean;
  isText?: boolean;
  isLeaf?: boolean;
};

export type AllOptions = {
  markdownit: MarkdownIt.Options;
  extensions: {
    colonFences?: boolean;
    frontmatter?: boolean;
    math?: boolean | MathExtensionOptions;
    footnotes?: boolean;
    deflist?: boolean;
    tasklist?: boolean;
    tables?: boolean;
    blocks?: boolean;
  };
  mdast: MdastOptions;
  directives: DirectiveSpec[];
  roles: RoleSpec[];
};
