import MarkdownIt from 'markdown-it';
import { Directive, IOptions as IDocutilsOptions, Role } from 'markdown-it-docutils';
import { Options as HastOptions } from 'mdast-util-to-hast';
import { MathExtensionOptions } from './plugins';
import { MdastOptions, Spec, TransformOptions } from './mdast';
import { Options as StringifyOptions } from 'rehype-stringify';
import { Handler } from 'mdast-util-to-hast';

export interface IDirective {
  myst: typeof Directive;
  mdast: Spec;
  hast: Handler;
}

export interface IRole {
  myst: typeof Role;
  mdast: Spec;
  hast: Handler;
}

export type AllOptions = {
  // Bring the roles and directives to the top level.
  // We may change the interface to be less dependent on markdown-it in the future
  roles: Record<string, IRole>;
  directives: Record<string, IDirective>;
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
