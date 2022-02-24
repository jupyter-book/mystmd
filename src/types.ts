import MarkdownIt from 'markdown-it';
import { IOptions as IDocutilsOptions } from 'markdown-it-docutils';
import { Options as HastOptions } from 'mdast-util-to-hast';
import { MathExtensionOptions } from './plugins';
import { MdastOptions, TransformOptions } from './mdast';
import { Options as StringifyOptions } from 'rehype-stringify';

export type AllOptions = {
  allowDangerousHtml: boolean;
  markdownit: MarkdownIt.Options;
  docutils: IDocutilsOptions;
  extensions: {
    frontmatter?: boolean;
    math?: boolean | MathExtensionOptions;
    footnotes?: boolean;
    deflist?: boolean;
    tasklist?: boolean;
    tables?: boolean;
    blocks?: boolean;
  };
  transform: TransformOptions;
  mdast: MdastOptions;
  hast: HastOptions;
  formatHtml: boolean;
  stringifyHtml: StringifyOptions;
};

export type Options = Partial<AllOptions>;
