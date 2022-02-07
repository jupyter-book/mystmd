import MarkdownIt from 'markdown-it'
import docutilsPlugin from 'markdown-it-docutils'
import { IOptions as IDocutilsOptions } from 'markdown-it-docutils'
import * as plugins from './plugins'

export type Options = {
  math?: boolean
  markdownit?: MarkdownIt.Options
  docutils?: IDocutilsOptions
}

export const defaultOptions: Options = {
  math: true,
  markdownit: { html: false }
}

function MyST(opts: Options = defaultOptions): MarkdownIt {
  const tokenizer = MarkdownIt('commonmark', opts.markdownit)
  if (opts.math) tokenizer.use(plugins.math)
  tokenizer.use(plugins.blocks)
  tokenizer.use(docutilsPlugin, opts.docutils)
  return tokenizer
}

export { MyST }
