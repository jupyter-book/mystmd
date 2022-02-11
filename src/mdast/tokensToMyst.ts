import { MarkdownParseState } from './fromMarkdown'
import type { Root } from 'mdast'
import { Spec, Token } from './types'

export type { Spec }
export { MarkdownParseState }

function removeNextTokens(tokens: Token[], start: number, num = 0) {
  tokens.splice(start + 1, start + num)
}

function getClassName(token: Token, exclude?: RegExp): string | undefined {
  const className: string = token.meta?.class?.join(' ') || token.attrGet('class')
  if (!className) return undefined
  return (
    className
      .split(' ')
      .map((c) => c.trim())
      .filter((c) => c && !(exclude && c.match(exclude)))
      .join(' ') || undefined
  )
}

function hasClassName(token: Token, matcher: RegExp): false | RegExpMatchArray {
  const className = getClassName(token)
  if (!className) return false
  const matches = className
    .split(' ')
    .map((c) => c.match(matcher))
    .filter((c) => c)
  if (matches.length === 0) return false
  return matches[0] as RegExpMatchArray
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
      console.log({ imge: token })
      const alt = token.attrGet('alt') || token.children?.[0]?.content
      const alignMatch = hasClassName(token, /align-(left|right|center)/)
      const align = alignMatch ? alignMatch[1] : undefined
      return {
        url: token.attrGet('src'),
        alt,
        title: token.attrGet('title') || undefined,
        class: getClassName(token, /align-(?:left|right|center)/),
        width: token.attrGet('width') || undefined,
        align,
      }
    },
  },
  abbr: {
    type: 'abbreviation',
    getAttrs(token) {
      const value = token.children?.[0]?.content
      return {
        title: token.attrGet('title') ?? undefined,
        value,
      }
    },
  },
  sub: {
    type: 'subscript',
  },
  sup: {
    type: 'superscript',
  },
  admonition: {
    type: 'admonition',
    getAttrs(token, tokens, index) {
      const kind = token.meta?.kind || undefined
      if (kind && tokens[index + 1]?.type === 'admonition_title_open') {
        removeNextTokens(tokens, index, 3)
      }
      return {
        kind,
        class: getClassName(token, new RegExp(`admonition|${kind}`)),
      }
    },
  },
  admonition_title: {
    type: 'admonitionTitle',
  },
  figure: {
    type: 'figure',
    getAttrs(token, tokens, index) {
      console.log({ figure: token })
      // const kind = token.meta?.kind || undefined
      // if (kind && tokens[index + 1]?.type === 'admonition_title_open') {
      //   removeNextTokens(tokens, index, 3)
      // }
      return {
        // kind,
        class: getClassName(token),
      }
    },
  },
  figure_caption: {
    type: 'figureCaption',
    getAttrs(token) {
      const number = token.attrGet('number') || undefined
      return { number }
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
