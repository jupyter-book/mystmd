import { MarkdownParseState } from './fromMarkdown'
import type { Root } from 'mdast'
import { Spec, Token } from './types'

export type { Spec }
export { MarkdownParseState }

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
