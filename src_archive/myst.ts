import MarkdownIt from 'markdown-it'
import * as plugins from './plugins'
import { directives } from './directives'
import { roles } from './roles'
import { Directives } from '../src_archive/directives/types'
import { Roles } from './roles/types'

export type Options = {
  directives: Directives
  roles: Roles
  math?: boolean
  markdownit?: MarkdownIt.Options
}

export const defaultOptions: Options = {
  directives,
  roles,
  math: true,
  markdownit: { html: false }
}

function MyST(opts: Options = defaultOptions): MarkdownIt {
  const tokenizer = MarkdownIt('commonmark', opts.markdownit)
  if (opts.math) tokenizer.use(plugins.math)
  tokenizer.use(plugins.blocks)
  tokenizer.use(plugins.directives(directives))
  tokenizer.use(plugins.roles(roles))
  return tokenizer
}

export { MyST }
