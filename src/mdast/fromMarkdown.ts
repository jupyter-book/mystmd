import type { Root, Parent } from 'mdast'
import type { GenericNode, GenericText, Spec, Token } from './types'

/** MarkdownParseState tracks the context of a running token stream.
 *
 * Loosly based on prosemirror-markdown
 */
export class MarkdownParseState {
  stack: GenericNode[]
  handlers: Record<string, TokenHandler>
  constructor(handlers: Record<string, Spec>) {
    this.stack = [{ type: 'root', children: [] } as Root]
    this.handlers = getTokenHandlers(handlers)
  }

  top() {
    return this.stack[this.stack.length - 1]
  }

  addNode(node?: GenericNode) {
    const top = this.top()
    if (this.stack.length && node && 'children' in top) top.children?.push(node)
    return node
  }

  addText(text: string, type = 'text') {
    const top = this.top()
    const value = text.replace('\n', type === 'text' ? '' : '\n')
    if (!value || !this.stack.length || !type || !('children' in top)) return
    const last = top.children[top.children.length - 1]
    if (last?.type === type) {
      // The last node is the same type, merge it with a space
      last.value += ` ${value}`
      return last
    }
    const node: GenericText = { type, value }
    top.children?.push(node)
    return node
  }

  openNode(type: string, attrs: Record<string, any>, isLeaf = false) {
    const node: GenericNode = { type, ...attrs }
    if (!isLeaf) (node as Parent).children = []
    this.stack.push(node)
  }

  closeNode() {
    const node = this.stack.pop()
    return this.addNode(node)
  }

  parseTokens(tokens?: Token[] | null) {
    tokens?.forEach((token, index) => {
      if (token.hidden) return
      const handler = this.handlers[token.type]
      if (!handler)
        throw new Error(
          'Token type `' + token.type + '` not supported by tokensToMyst parser',
        )
      handler(this, token, tokens, index)
    })
  }
}

type TokenHandler = (
  state: MarkdownParseState,
  token: Token,
  tokens: Token[],
  index: number,
) => void

function attrs(spec: Spec, token: Token, tokens: Token[], index: number) {
  const attrs = spec.getAttrs?.(token, tokens, index) || spec.attrs || {}
  if ('type' in attrs) throw new Error('You can not have "type" as attrs.')
  if ('children' in attrs) throw new Error('You can not have "children" as attrs.')
  return attrs
}

function withoutTrailingNewline(str: string) {
  return str[str.length - 1] == '\n' ? str.slice(0, str.length - 1) : str
}

function noCloseToken(spec: Spec, type: string) {
  return (
    spec.noCloseToken ||
    type == 'code_inline' ||
    type == 'code_block' ||
    type == 'fence'
  )
}

function getTokenHandlers(specHandlers: Record<string, Spec>) {
  const handlers: Record<string, TokenHandler> = {}

  Object.entries(specHandlers).forEach(([type, spec]) => {
    const nodeType = spec.type
    if (noCloseToken(spec, type)) {
      handlers[type] = (state, tok, tokens, i) => {
        if (spec.isText) {
          state.addText(withoutTrailingNewline(tok.content), spec.type)
          return
        }
        state.openNode(nodeType, attrs(spec, tok, tokens, i), spec.isLeaf)
        state.addText(withoutTrailingNewline(tok.content))
        state.closeNode()
      }
    } else {
      handlers[type + '_open'] = (state, tok, tokens, i) =>
        state.openNode(nodeType, attrs(spec, tok, tokens, i))
      handlers[type + '_close'] = (state) => state.closeNode()
    }
  })

  handlers.text = (state, tok) => state.addText(tok.content)
  handlers.inline = (state, tok) => state.parseTokens(tok.children)
  handlers.softbreak = handlers.softbreak || ((state) => state.addText('\n'))
  return handlers
}
