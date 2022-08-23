import MarkdownIt from 'markdown-it';
import { Root } from 'mdast';
import type { Plugin } from 'unified';
import { unified } from 'unified';
import rehypeStringify from 'rehype-stringify';
import { directivesDefault, rolesDefault } from 'markdown-it-docutils';
import { MARKDOWN_IT_CONFIG } from './config';
import { formatHtml, mystToHast, tokensToMyst, transform, State } from './mdast';
import {
  mathPlugin,
  convertFrontMatter,
  frontMatterPlugin,
  colonFencePlugin,
  mystBlockPlugin,
  footnotePlugin,
  docutilsPlugin,
  deflistPlugin,
  tasklistPlugin,
} from './plugins';
import type { AllOptions, Options } from './types';

export type { Options, IRole, IDirective } from './types';

export {
  directivesDefault,
  Directive,
  IDirectiveData,
  directiveOptions,
  Role,
  rolesDefault,
  IRoleData,
} from 'markdown-it-docutils';

export const defaultOptions: Omit<AllOptions, 'roles' | 'directives'> = {
  allowDangerousHtml: false,
  markdownit: {},
  extensions: {
    colonFences: true,
    frontmatter: true,
    math: true,
    footnotes: true,
    deflist: true,
    tasklist: true,
    tables: true,
    blocks: true,
  },
  transform: {},
  docutils: {
    roles: rolesDefault,
    directives: directivesDefault,
  },
  mdast: {},
  hast: {
    clobberPrefix: 'm-',
  },
  formatHtml: true,
  stringifyHtml: {},
};

export class MyST {
  opts: Omit<AllOptions, 'roles' | 'directives'>;
  tokenizer: MarkdownIt;

  constructor(opts: Options = defaultOptions) {
    this.opts = this._parseOptions(opts);
    this.tokenizer = this._createTokenizer();
  }

  _parseOptions(user: Options): Omit<AllOptions, 'roles' | 'directives'> {
    const opts = {
      allowDangerousHtml: user.allowDangerousHtml ?? defaultOptions.allowDangerousHtml,
      transform: { ...defaultOptions.transform, ...user.transform },
      mdast: { ...defaultOptions.mdast, ...user.mdast },
      hast: { ...defaultOptions.hast, ...user.hast },
      docutils: { ...defaultOptions.docutils, ...user.docutils },
      markdownit: { ...defaultOptions.markdownit, ...user.markdownit },
      extensions: { ...defaultOptions.extensions, ...user.extensions },
      formatHtml: user.formatHtml ?? defaultOptions.formatHtml,
      stringifyHtml: { ...defaultOptions.stringifyHtml, ...user.stringifyHtml },
    };
    const rolesHandlers: Required<AllOptions['docutils']>['roles'] = {};
    const directivesHandlers: Required<AllOptions['docutils']>['directives'] = {};
    const mdastHandlers: Required<AllOptions['mdast']>['handlers'] = {};
    const hastHandlers: Required<AllOptions['hast']>['handlers'] = {};
    Object.entries(user.roles ?? {}).map(([k, { myst, mdast, hast }]) => {
      rolesHandlers[k] = myst;
      mdastHandlers[k] = mdast;
      hastHandlers[mdast.type] = hast;
    });
    Object.entries(user.directives ?? {}).map(([k, { myst, mdast, hast }]) => {
      directivesHandlers[k] = myst;
      mdastHandlers[k] = mdast;
      hastHandlers[mdast.type] = hast;
    });
    opts.docutils.roles = { ...opts.docutils.roles, ...rolesHandlers };
    opts.docutils.directives = { ...opts.docutils.directives, ...directivesHandlers };
    opts.hast.handlers = { ...opts.hast.handlers, ...hastHandlers };
    opts.mdast.handlers = { ...opts.mdast.handlers, ...mdastHandlers };
    if (opts.allowDangerousHtml) {
      opts.markdownit.html = true;
      opts.hast.allowDangerousHtml = true;
      opts.hast.allowDangerousHtml = true;
      opts.stringifyHtml.allowDangerousHtml = true;
    }
    return opts;
  }

  _createTokenizer() {
    const exts = this.opts.extensions;
    const tokenizer = MarkdownIt(MARKDOWN_IT_CONFIG as any, this.opts.markdownit);
    if (exts.tables) tokenizer.enable('table');
    if (exts.colonFences) tokenizer.use(colonFencePlugin);
    if (exts.frontmatter) tokenizer.use(frontMatterPlugin, () => ({})).use(convertFrontMatter);
    if (exts.blocks) tokenizer.use(mystBlockPlugin);
    if (exts.footnotes) tokenizer.use(footnotePlugin).disable('footnote_inline'); // not yet implemented in myst-parser
    tokenizer.use(docutilsPlugin, this.opts.docutils);
    if (exts.math) tokenizer.use(mathPlugin, exts.math);
    if (exts.deflist) tokenizer.use(deflistPlugin);
    if (exts.tasklist) tokenizer.use(tasklistPlugin);
    return tokenizer;
  }

  parse(content: string) {
    return tokensToMyst(this.tokenizer.parse(content, {}), this.opts.mdast);
  }

  render(content: string) {
    const tree = this.parse(content);
    const html = this.renderMdast(tree);
    return html;
  }

  renderMdast(tree: Root) {
    const state = new State();
    const pipe = unified()
      .use(transform, state, this.opts.transform)
      .use(mystToHast, this.opts.hast)
      .use(formatHtml, this.opts.formatHtml)
      .use(rehypeStringify, this.opts.stringifyHtml);
    const result = pipe.runSync(tree);
    const html = pipe.stringify(result);
    return html.trim();
  }
}

/**
 * MyST Parser as a Unified Plugin
 */
export const mystParser: Plugin<[Options?], string, Root> = function mystParser() {
  this.Parser = (content: string, opts?: Options) => {
    return new MyST(opts).parse(content);
  };
};
