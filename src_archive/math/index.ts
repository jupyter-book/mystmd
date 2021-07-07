import MarkdownIt from 'markdown-it'
import markdownTexMath from 'markdown-it-texmath'
import amsmathPlugin from '../../src/mditPlugins/amsmath'
import { renderMath } from './utils'

export function addMathRenderers(md: MarkdownIt): void {
  const { renderer } = md
  renderer.rules.math_inline = (tokens, idx) => renderMath(tokens[idx].content, false)
  // Note: this will actually create invalid HTML
  renderer.rules.math_inline_double = (tokens, idx) =>
    renderMath(tokens[idx].content, true)
  renderer.rules.math_block = (tokens, idx) => renderMath(tokens[idx].content, true)
  renderer.rules.math_block_end = () => ''
  renderer.rules.math_block_eqno = (tokens, idx) =>
    renderMath(tokens[idx].content, true, tokens[idx].meta?.target)
  renderer.rules.math_block_eqno_end = () => ''
}

export function plugin(md: MarkdownIt): void {
  md.use(markdownTexMath, {
    engine: { renderToString: (s: string) => s }, // We are not going to render ever.
    delimiters: 'dollars'
  })
  amsmathPlugin(md)
  // Note: numbering of equations for `math_block_eqno` happens in the directives rules
  addMathRenderers(md)
}
