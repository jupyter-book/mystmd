import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.js';
import type { DirectiveSpec, RoleSpec } from 'myst-common';
import type { VFile } from 'vfile';
import type { MathExtensionOptions } from './plugins.js';
import type { MarkdownParseState } from './fromMarkdown.js';

export type MdastOptions = {
  handlers?: Record<string, TokenHandlerSpec>;
  hoistSingleImagesOutofParagraphs?: boolean;
  nestBlocks?: boolean;
};

export type TokenHandlerSpec = {
  type: string;
  getAttrs?: (
    token: Token,
    tokens: Token[],
    index: number,
    state: MarkdownParseState,
  ) => Record<string, any>;
  attrs?: Record<string, any>;
  noCloseToken?: boolean;
  isText?: boolean;
  isLeaf?: boolean;
};

export type AllOptions = {
  vfile: VFile;
  markdownit: MarkdownIt.Options;
  extensions: {
    smartquotes?: boolean;
    colonFences?: boolean;
    frontmatter?: boolean;
    math?: boolean | MathExtensionOptions;
    footnotes?: boolean;
    citations?: boolean;
    deflist?: boolean;
    tasklist?: boolean;
    tables?: boolean;
    blocks?: boolean;
  };
  mdast: MdastOptions;
  directives: DirectiveSpec[];
  roles: RoleSpec[];
};
