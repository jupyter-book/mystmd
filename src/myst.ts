import MarkdownIt from 'markdown-it'
import frontMatterPlugin from 'markdown-it-front-matter'
import footnotePlugin from 'markdown-it-footnote'
import tasklistPlugin from 'markdown-it-task-lists'
import deflistPlugin from 'markdown-it-deflist'
import { docutilsPlugin } from 'markdown-it-docutils'
import { IOptions as IDocutilsOptions } from 'markdown-it-docutils'
import { math, MathExtensionOptions, blocks, convertFrontMatter } from './plugins'

export type Options = {
  markdownit?: MarkdownIt.Options
  docutils?: IDocutilsOptions
  extensions?: {
    frontmatter?: boolean
    math?: boolean | MathExtensionOptions
    footnotes?: boolean
    deflist?: boolean
    tasklist?: boolean
    tables?: boolean
    blocks?: boolean
  }
}

export const defaultExtensions: Required<Options>['extensions'] = {
  math: true,
  deflist: true,
  tasklist: true,
}

export const defaultOptions: Options = {
  markdownit: { html: false },
  extensions: defaultExtensions,
}

function MyST(opts: Options = defaultOptions): MarkdownIt {
  const tokenizer = MarkdownIt('commonmark', opts.markdownit)
  const exts = opts.extensions ?? defaultExtensions
  if (exts.tables) tokenizer.enable('table')

  if (exts.frontmatter)
    tokenizer.use(frontMatterPlugin, () => ({})).use(convertFrontMatter)
  if (exts.blocks) tokenizer.use(blocks)
  if (exts.footnotes) tokenizer.use(footnotePlugin).disable('footnote_inline') // not yet implemented in myst-parser
  tokenizer.use(docutilsPlugin, opts.docutils)
  if (exts.math) tokenizer.use(math, exts.math)
  if (exts.deflist) tokenizer.use(deflistPlugin)
  if (exts.tasklist) tokenizer.use(tasklistPlugin)
  return tokenizer
}

export { MyST }
