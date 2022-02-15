import { Root } from 'mdast'
import { Handler, toHast, all, Options } from 'mdast-util-to-hast'
import { u } from 'unist-builder'
import classNames from 'classnames'
import { AdmonitionKind } from './types'
import { Plugin } from 'unified'

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
      id: node.name || undefined, // TODO: change to label/identifier
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
      class: classNames({
        [node.class]: node.class, // The custom class is first!!
        admonition: true,
        [node.kind]: node.kind && node.kind !== AdmonitionKind.admonition,
      }),
    },
    all(h, node),
  )

const captionNumber: Handler = (h, node) =>
  h(node, 'span', { class: 'caption-number' }, [u('text', 'Figure 1')])

const math: Handler = (h, node) => {
  const attrs = { id: node.label || undefined, class: 'math block' }
  if (node.value.indexOf('\n') !== -1) {
    const math = h(node, 'div', attrs, [u('text', node.value)])
    return h(node, 'pre', [math])
  }
  return h(node, 'div', attrs, [u('text', node.value.replace(/\r?\n|\r/g, ' '))])
}

const inlineMath: Handler = (h, node) => {
  return h(node, 'span', { class: 'math inline' }, [
    u('text', node.value.replace(/\r?\n|\r/g, ' ')),
  ])
}

const definitionList: Handler = (h, node) => h(node, 'dl', all(h, node))
const definitionTerm: Handler = (h, node) => h(node, 'dt', all(h, node))
const definitionDescription: Handler = (h, node) => h(node, 'dd', all(h, node))

const footnoteRef: Handler = (h, node) => h(node, 'span', all(h, node))

const cite: Handler = (h, node) =>
  h(node, 'cite', { class: 'unhandled-role' }, all(h, node))

const role: Handler = (h, node) =>
  h(node, 'span', { class: 'unhandled-role' }, all(h, node))

const directive: Handler = (h, node) =>
  h(node, 'div', { class: 'unhandled-role' }, all(h, node))

export const mystToHast: Plugin<[Options?], string, Root> = (opts) => (tree: Root) => {
  return toHast(tree, {
    ...opts,
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
      math,
      inlineMath,
      definitionList,
      definitionTerm,
      definitionDescription,
      footnoteRef,
      cite,
      role,
      directive,
      ...opts?.handlers,
    },
  })
}
