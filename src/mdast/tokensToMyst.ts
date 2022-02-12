import { MarkdownParseState } from './fromMarkdown'
import type { Root } from 'mdast'
import { Spec, Token, Container, AdmonitionKind } from './types'
import { visit } from 'unist-util-visit'
import he from 'he'
import { GenericNode } from '.'
import { admonitionKindToTitle, withoutTrailingNewline } from './utils'

export { MarkdownParseState }

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

function getLang(t: Token) {
  return he.decode(t.info).trim().split(' ')[0].replace('\\', '')
}

const defaultMdast: Record<string, Spec> = {
  heading: {
    type: 'heading',
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
  bullet_list: {
    type: 'list',
    attrs: {
      ordered: false,
      spread: false,
    },
  },
  list_item: {
    type: 'listItem',
    attrs: {
      spread: true,
    },
  },
  em: {
    type: 'emphasis',
  },
  strong: {
    type: 'strong',
  },
  fence: {
    // TODO
    type: 'code',
    getAttrs(t) {
      return { lang: getLang(t), value: withoutTrailingNewline(t.content) }
    },
  },
  code_block: {
    // TODO
    type: 'code',
    isText: true,
    getAttrs(t) {
      return { lang: getLang(t), value: withoutTrailingNewline(t.content) }
    },
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
      const alt =
        token.attrGet('alt') || token.children?.reduce((i, t) => i + t?.content, '')
      const alignMatch = hasClassName(token, /align-(left|right|center)/)
      const align = alignMatch ? alignMatch[1] : undefined
      return {
        url: token.attrGet('src'),
        alt: alt || undefined,
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
    getAttrs(token) {
      const kind = token.meta?.kind || undefined
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
    type: 'container',
    getAttrs(token): Container {
      const name = token.meta?.name || undefined
      return {
        kind: 'figure',
        name,
        numbered: name ? true : undefined,
        class: getClassName(token, /numbered/),
      }
    },
  },
  figure_caption: {
    type: 'caption',
  },
  math_inline: {
    type: 'inlineMath',
    noCloseToken: true,
    isText: true,
  },
  math_inline_double: {
    type: 'math',
    noCloseToken: true,
    isText: true,
  },
  math_block: {
    type: 'math',
    noCloseToken: true,
    isText: true,
  },
  math_block_label: {
    type: 'span',
    noCloseToken: true,
    isText: true,
  },
  amsmath: {
    type: 'math',
    noCloseToken: true,
    isText: true,
  },
  ref: {
    type: 'cite',
    getAttrs(t) {
      return {
        kind: 'ref',
      }
    },
  },
  directive: {
    type: 'div',
    noCloseToken: true,
  },
  role: {
    type: 'span',
  },
  html_inline: {
    type: 'html',
    noCloseToken: true,
    isText: true,
  },
  html_block: {
    type: 'html',
    noCloseToken: true,
    isText: true,
  },
}

export function tokensToMyst(tokens: Token[], handlers = defaultMdast): Root {
  const state = new MarkdownParseState(handlers)
  state.parseTokens(tokens)
  let doc: Root
  do {
    doc = state.closeNode() as Root
  } while (state.stack.length)

  // Remove unnecessary admonition titles from AST
  // These are up to the serializer to put in
  visit(doc, 'admonition', (node: GenericNode) => {
    const { kind, children } = node
    if (!kind || !children || kind === AdmonitionKind.admonition) return
    const expectedTitle = admonitionKindToTitle(kind)
    const titleNode = children[0]
    if (
      titleNode.type === 'admonitionTitle' &&
      titleNode.children?.[0]?.value === expectedTitle
    )
      node.children = children.slice(1)
  })
  return doc
}
