import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import type { MathExtensionOptions } from './plugins';
import type { MdastOptions } from './tokensToMyst';

export type Spec = {
  type: string;
  getAttrs?: (token: Token, tokens: Token[], index: number) => Record<string, any>;
  attrs?: Record<string, any>;
  noCloseToken?: boolean;
  isText?: boolean;
  isLeaf?: boolean;
};

export type AllOptions = {
  allowDangerousHtml: boolean;
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
};

export type Options = Partial<AllOptions>;
