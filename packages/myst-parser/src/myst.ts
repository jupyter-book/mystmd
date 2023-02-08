import MarkdownIt from 'markdown-it';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { MARKDOWN_IT_CONFIG } from './config';
import { tokensToMyst } from './tokensToMyst';
import {
  mathPlugin,
  convertFrontMatter,
  frontMatterPlugin,
  colonFencePlugin,
  mystBlockPlugin,
  footnotePlugin,
  mystPlugin,
  deflistPlugin,
  tasklistPlugin,
} from './plugins';
import type { AllOptions, Options } from './types';

export const defaultOptions: AllOptions = {
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
  mdast: {},
};

export class MyST {
  opts: AllOptions;
  tokenizer: MarkdownIt;

  constructor(opts: Options = defaultOptions) {
    this.opts = this._parseOptions(opts);
    this.tokenizer = this._createTokenizer();
  }

  _parseOptions(user: Options): AllOptions {
    const opts = {
      allowDangerousHtml: user.allowDangerousHtml ?? defaultOptions.allowDangerousHtml,
      mdast: { ...defaultOptions.mdast, ...user.mdast },
      markdownit: { ...defaultOptions.markdownit, ...user.markdownit },
      extensions: { ...defaultOptions.extensions, ...user.extensions },
    };
    const mdastHandlers: Required<AllOptions['mdast']>['handlers'] = {};
    opts.mdast.handlers = { ...opts.mdast.handlers, ...mdastHandlers };
    if (opts.allowDangerousHtml) {
      opts.markdownit.html = true;
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
    tokenizer.use(mystPlugin);
    if (exts.math) tokenizer.use(mathPlugin, exts.math);
    if (exts.deflist) tokenizer.use(deflistPlugin);
    if (exts.tasklist) tokenizer.use(tasklistPlugin);
    return tokenizer;
  }

  parse(content: string) {
    return tokensToMyst(this.tokenizer.parse(content, {}), this.opts.mdast);
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
