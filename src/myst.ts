import MarkdownIt from 'markdown-it'
import frontMatterPlugin from 'markdown-it-front-matter'
import footnotePlugin from 'markdown-it-footnote'
import tasklistPlugin from 'markdown-it-task-lists'
import deflistPlugin from 'markdown-it-deflist'
import { docutilsPlugin } from 'markdown-it-docutils'
import { IOptions as IDocutilsOptions } from 'markdown-it-docutils'
import { Options as HastOptions } from 'mdast-util-to-hast'
import { math, MathExtensionOptions, blocks, convertFrontMatter } from './plugins'
import { formatHtml, jsonParser, mystToHast, tokensToMyst } from './mdast'
import { unified } from 'unified'
import rehypeStringify, { Options as StringifyOptions } from 'rehype-stringify'
import { Root } from 'mdast'
import { transform, Options as TransformOptions } from './mdast/transforms'

type AllOptions = {
  allowDangerousHtml: boolean
  markdownit: MarkdownIt.Options
  docutils: IDocutilsOptions
  extensions: {
    frontmatter?: boolean
    math?: boolean | MathExtensionOptions
    footnotes?: boolean
    deflist?: boolean
    tasklist?: boolean
    tables?: boolean
    blocks?: boolean
  }
  transform: TransformOptions
  hast: HastOptions
  formatHtml: boolean
  stringifyHtml: StringifyOptions
}
export type Options = Partial<AllOptions>

export const defaultOptions: AllOptions = {
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
  hast: {},
  formatHtml: true,
  stringifyHtml: {},
}

class MyST {
  tokenizer: MarkdownIt
  opts: AllOptions

  constructor(opts: Options = defaultOptions) {
    const tokenizer = MarkdownIt('commonmark', opts.markdownit)
    this.opts = {
      allowDangerousHtml: opts.allowDangerousHtml ?? false,
      transform: opts.transform ?? defaultOptions.transform,
      hast: opts.hast ?? defaultOptions.hast,
      docutils: opts.docutils ?? defaultOptions.docutils,
      markdownit: opts.markdownit ?? defaultOptions.markdownit,
      extensions: opts.extensions ?? defaultOptions.extensions,
      formatHtml: opts.formatHtml ?? defaultOptions.formatHtml,
      stringifyHtml: opts.stringifyHtml ?? defaultOptions.stringifyHtml,
    }
    if (this.opts.allowDangerousHtml) {
      this.opts.markdownit.html = true
      this.opts.hast.allowDangerousHtml = true
      this.opts.hast.allowDangerousHtml = true
      this.opts.stringifyHtml.allowDangerousHtml = true
    }
    const exts = this.opts.extensions ?? {}
    if (exts.tables) tokenizer.enable('table')

    if (exts.frontmatter)
      tokenizer.use(frontMatterPlugin, () => ({})).use(convertFrontMatter)
    if (exts.blocks) tokenizer.use(blocks)
    if (exts.footnotes) tokenizer.use(footnotePlugin).disable('footnote_inline') // not yet implemented in myst-parser
    tokenizer.use(docutilsPlugin, opts.docutils)
    if (exts.math) tokenizer.use(math, exts.math)
    if (exts.deflist) tokenizer.use(deflistPlugin)
    if (exts.tasklist) tokenizer.use(tasklistPlugin)

    this.tokenizer = tokenizer
  }

  parse(content: string) {
    return tokensToMyst(this.tokenizer.parse(content, {}))
  }

  async render(content: string) {
    const tree = this.parse(content)
    const html = this.renderMdast(tree)
    return html
  }

  async renderMdast(tree: Root) {
    const pipe = unified()
      .use(jsonParser)
      .use(transform, this.opts.transform)
      .use(mystToHast, this.opts.hast)
      .use(formatHtml, this.opts.formatHtml)
      .use(rehypeStringify, this.opts.stringifyHtml)
    const result = await pipe.process(JSON.stringify(tree))
    const html = result.value as string
    return html.trim()
  }
}

export { MyST }
