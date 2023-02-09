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
import { applyDirectives } from './directives';
import { applyRoles } from './roles';
import type { AllOptions } from './types';

type Options = Partial<AllOptions>;

export const defaultOptions: AllOptions = {
  markdownit: {
    html: false,
  },
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
  directives: [],
  roles: [],
};

function parseOptions(opts?: Options): AllOptions {
  const parsedOpts = {
    mdast: { ...defaultOptions.mdast, ...opts?.mdast },
    markdownit: { ...defaultOptions.markdownit, ...opts?.markdownit },
    extensions: { ...defaultOptions.extensions, ...opts?.extensions },
    directives: [...defaultOptions.directives, ...(opts?.directives ?? [])],
    roles: [...defaultOptions.roles, ...(opts?.roles ?? [])],
  };
  return parsedOpts;
}

export function createTokenizer(opts?: Options) {
  const parsedOpts = parseOptions(opts);
  const { extensions, markdownit } = parsedOpts;
  const tokenizer = MarkdownIt(MARKDOWN_IT_CONFIG as any, markdownit);
  if (extensions.tables) tokenizer.enable('table');
  if (extensions.colonFences) tokenizer.use(colonFencePlugin);
  if (extensions.frontmatter) tokenizer.use(frontMatterPlugin, () => ({})).use(convertFrontMatter);
  if (extensions.blocks) tokenizer.use(mystBlockPlugin);
  if (extensions.footnotes) tokenizer.use(footnotePlugin).disable('footnote_inline'); // not yet implemented in myst-parser
  tokenizer.use(mystPlugin);
  if (extensions.math) tokenizer.use(mathPlugin, extensions.math);
  if (extensions.deflist) tokenizer.use(deflistPlugin);
  if (extensions.tasklist) tokenizer.use(tasklistPlugin);
  return tokenizer;
}

export function mystParse(content: string, opts?: Options) {
  const parsedOpts = parseOptions(opts);
  const tokenizer = createTokenizer(parsedOpts);
  const tree = tokensToMyst(tokenizer.parse(content, {}), parsedOpts.mdast);
  applyDirectives(tree, parsedOpts.directives);
  applyRoles(tree, parsedOpts.roles);
  return tree;
}

/**
 * MyST Parser as a Unified Plugin
 */
export const mystParser: Plugin<[Options?], string, Root> = function mystParser() {
  this.Parser = (content: string, opts?: Options) => {
    return mystParse(content, opts);
  };
};
