import type MarkdownIt from 'markdown-it'
import type StateCore from 'markdown-it/lib/rules_core/state_core'

export { plugin as blocks } from './blocks'
export { plugin as math, MathExtensionOptions } from './math'

/** Markdown-it plugin to convert the front-matter token to a renderable token, for previews */
export function convertFrontMatter(md: MarkdownIt) {
  md.core.ruler.after('block', 'convert_front_matter', (state: StateCore) => {
    if (state.tokens.length && state.tokens[0].type === 'front_matter') {
      const replace = new state.Token('fence', 'code', 0)
      replace.map = state.tokens[0].map
      replace.info = 'yaml'
      replace.content = state.tokens[0].meta
      state.tokens[0] = replace
    }
    return true
  })
}
