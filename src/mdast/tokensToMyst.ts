import { MarkdownParseState } from './fromMarkdown'
import type { Root } from 'mdast'
import { Spec, Token } from './types'

export type { Spec }
export { MarkdownParseState }

function removeNextTokens(tokens: Token[], start: number, num = 0) {
  tokens.splice(start + 1, start + num)
}

const defaultMdast: Record<string, Spec> = {
  heading: {
    type: 'header',
    getAttrs(token) {
      return { depth: Number(token.tag[1]) }
    },
  },
  hr: {
    type: 'thematicBreak',
    noCloseToken: true,
  },
  paragraph: {
    type: 'paragraph',
  },
  blockquote: {
    type: 'blockquote',
  },
  ordered_list: {
    type: 'list',
    getAttrs(token, tokens, index) {
      const info = tokens[index + 1]?.info
      const start = Number(tokens[index + 1]?.info)
      return {
        ordered: true,
        start: isNaN(start) || !info ? 1 : start,
        spread: false,
      }
    },
  },
  list_item: {
    type: 'listItem',
    attrs: { spread: false },
  },
  em: {
    type: 'emphasis',
  },
  strong: {
    type: 'strong',
  },
  code_inline: {
    type: 'inlineCode',
    noCloseToken: true,
    isText: true,
  },
  hardbreak: {
    type: 'break',
    noCloseToken: true,
    isLeaf: true,
  },
  link: {
    type: 'link',
    getAttrs(token) {
      return {
        url: token.attrGet('href'),
        title: token.attrGet('title') ?? undefined,
      }
    },
  },
  image: {
    type: 'image',
    noCloseToken: true,
    isLeaf: true,
    getAttrs(token) {
      console.log(token)
      const alt = token.children?.[0]?.content
      return {
        url: token.attrGet('src'),
        title: token.attrGet('title') ?? undefined,
        alt,
      }
    },
  },
  abbr: {
    type: 'abbr',
    getAttrs(token) {
      const value = token.children?.[0]?.content
      return {
        title: token.attrGet('title') ?? undefined,
        value,
      }
    },
  },
  admonition: {
    type: 'admonition',
    getAttrs(token, tokens, index) {
      const kind = token.meta.kind || undefined
      const className = token.meta.class?.join(' ').trim() || undefined
      if (kind && tokens[index + 1]?.type === 'admonition_title_open') {
        removeNextTokens(tokens, index, 3)
      }
      return {
        kind,
        class: className,
      }
    },
  },
  admonition_title: {
    type: 'admonitionTitle',
  },
}

export function tokensToMyst(tokens: Token[], handlers = defaultMdast): Root {
  const state = new MarkdownParseState(handlers)
  state.parseTokens(tokens)
  let doc: Root
  do {
    doc = state.closeNode() as Root
  } while (state.stack.length)
  return doc
}
