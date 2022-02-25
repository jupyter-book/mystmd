import MarkdownIt from 'markdown-it';
import {
  mathPlugin,
  convertFrontMatter,
  frontMatterPlugin,
  mystBlockPlugin,
  footnotePlugin,
  docutilsPlugin,
  deflistPlugin,
  tasklistPlugin,
} from './plugins';
import { Root } from 'mdast';
import type { Plugin } from 'unified';
import { formatHtml, mystToHast, tokensToMyst, transform, State } from './mdast';
import { unified } from 'unified';
import rehypeStringify from 'rehype-stringify';
import type { AllOptions, Options } from './types';
import { directivesDefault, rolesDefault } from 'markdown-it-docutils';

export type { Options } from './types';

export {
  directivesDefault,
  Directive,
  IDirectiveData,
  directiveOptions,
  Role,
  rolesDefault,
  IRoleData,
} from 'markdown-it-docutils';

export const defaultOptions: AllOptions = {
  roles: rolesDefault,
  directives: directivesDefault,
  allowDangerousHtml: false,
  markdownit: {},
  extensions: {
    frontmatter: true,
    math: true,
    footnotes: true,
    deflist: true,
    tasklist: true,
    tables: true,
    blocks: true,
  },
  transform: {},
  docutils: {},
  mdast: {},
  hast: {
    clobberPrefix: 'm-',
  },
  formatHtml: true,
  stringifyHtml: {},
};

export class MyST {
  tokenizer: MarkdownIt;
  opts: AllOptions;

  constructor(opts: Options = defaultOptions) {
    this.opts = {
      roles: opts.roles ?? rolesDefault,
      directives: opts.directives ?? directivesDefault,
      allowDangerousHtml: opts.allowDangerousHtml ?? defaultOptions.allowDangerousHtml,
      transform: { ...defaultOptions.transform, ...opts.transform },
      mdast: { ...defaultOptions.mdast, ...opts.mdast },
      hast: { ...defaultOptions.hast, ...opts.hast },
      docutils: { ...defaultOptions.docutils, ...opts.docutils },
      markdownit: { ...defaultOptions.markdownit, ...opts.markdownit },
      extensions: { ...defaultOptions.extensions, ...opts.extensions },
      formatHtml: opts.formatHtml ?? defaultOptions.formatHtml,
      stringifyHtml: { ...defaultOptions.stringifyHtml, ...opts.stringifyHtml },
    };
    if (this.opts.allowDangerousHtml) {
      this.opts.markdownit.html = true;
      this.opts.hast.allowDangerousHtml = true;
      this.opts.hast.allowDangerousHtml = true;
      this.opts.stringifyHtml.allowDangerousHtml = true;
    }
    const exts = this.opts.extensions;

    const tokenizer = MarkdownIt('commonmark', opts.markdownit);
    if (exts.tables) tokenizer.enable('table');
    if (exts.frontmatter)
      tokenizer.use(frontMatterPlugin, () => ({})).use(convertFrontMatter);
    if (exts.blocks) tokenizer.use(mystBlockPlugin);
    if (exts.footnotes) tokenizer.use(footnotePlugin).disable('footnote_inline'); // not yet implemented in myst-parser
    tokenizer.use(docutilsPlugin, {
      ...opts.docutils,
      roles: opts.roles,
      directives: opts.directives,
    });
    if (exts.math) tokenizer.use(mathPlugin, exts.math);
    if (exts.deflist) tokenizer.use(deflistPlugin);
    if (exts.tasklist) tokenizer.use(tasklistPlugin);

    this.tokenizer = tokenizer;
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
