import { Root } from 'mdast'
import { visit } from 'unist-util-visit'
import { selectAll } from 'unist-util-select'
import { Handler, toHast, all } from 'mdast-util-to-hast'
import { u } from 'unist-builder'
import classNames from 'classnames'
import { Admonition, GenericNode, AdmonitionKind } from './types'
import { Plugin } from 'unified'

function admonitionKindToTitle(kind: AdmonitionKind) {
  const transform: Record<string, string> = {
    attention: 'Attention',
    caution: 'Caution',
    danger: 'Danger',
    error: 'Error',
    important: 'Important',
    hint: 'Hint',
    note: 'Note',
    seealso: 'See Also',
    tip: 'Tip',
    warning: 'Warning',
  }
  return transform[kind] || `Unknown Admonition "${kind}"`
}

const inlineMath: Handler = (h, node) => {
  return h(node, 'span', { class: 'math inline' }, [
    u('text', node.value.replace(/\r?\n|\r/g, ' ')),
  ])
}

const abbreviation: Handler = (h, node) =>
  h(node, 'abbr', { title: node.title }, all(h, node))

const subscript: Handler = (h, node) => h(node, 'sub', all(h, node))
const superscript: Handler = (h, node) => h(node, 'sup', all(h, node))
const image: Handler = (h, node) =>
  h(node, 'img', {
    src: node.url,
    alt: node.alt,
    title: node.title,
    class: classNames(node.align ? `align-${node.align}` : '', node.class) || undefined,
    width: node.width,
  })
const caption: Handler = (h, node) => h(node, 'figcaption', all(h, node))
const container: Handler = (h, node) =>
  h(
    node,
    'figure',
    {
      id: node.name || undefined,
      class: classNames({ numbered: node.numbered }, node.class) || undefined,
    },
    all(h, node),
  )

const admonitionTitle: Handler = (h, node) =>
  h(node, 'p', { class: 'admonition-title' }, all(h, node))

const admonition: Handler = (h, node) =>
  h(
    node,
    'aside',
    {
      class: classNames('admonition', {
        [node.kind]: node.kind && node.kind !== AdmonitionKind.admonition,
        [node.class]: node.class,
      }),
    },
    all(h, node),
  )

const captionNumber: Handler = (h, node) =>
  h(node, 'span', { class: 'caption-number' }, [u('text', 'Figure 1')])

export const mystToHast: Plugin<void[], string, Root> = () => (tree: Root) => {
  // Visit all admonitions and add headers if necessary
  visit(tree, 'admonition', (node: Admonition) => {
    if (!node.kind || node.kind === AdmonitionKind.admonition) return
    node.children = [
      {
        type: 'admonitionTitle',
        children: [{ type: 'text', value: admonitionKindToTitle(node.kind) }],
      },
      ...(node.children ?? []),
    ]
  })
  // Visit all containers and add captions
  selectAll('container[numbered=true] caption > paragraph', tree).forEach(
    (para: GenericNode) => {
      para.children = [{ type: 'captionNumber' }, ...(para.children ?? [])]
    },
  )
  // Hoist up all paragraphs with a single image
  visit(tree, 'paragraph', (node: GenericNode) => {
    if (!(node.children?.length === 1 && node.children?.[0].type === 'image')) return
    const child = node.children[0]
    Object.keys(node).forEach((k) => {
      delete node[k]
    })
    Object.assign(node, child)
  })
  return toHast(tree, {
    handlers: {
      admonition,
      admonitionTitle,
      container,
      image,
      caption,
      captionNumber,
      abbreviation,
      subscript,
      superscript,
      inlineMath,
    },
  })
}
