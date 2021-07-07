import { Target } from '../state'
import { toHTML } from '../utils'

export const renderMath = (math: string, block: boolean, target?: Target): string => {
  const { id, number } = target ?? {}
  const [html] = toHTML(
    [
      block ? 'div' : 'span',
      {
        class: target ? ['math', 'numbered'] : 'math',
        id,
        number,
        children: block ? `\\[\n${math}\n\\]` : `\\(${math}\\)`
      }
    ],
    { inline: true }
  )
  return block ? `${html}\n` : html
}
