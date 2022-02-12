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

const math: Handler = (h, node) => {
  if (node.value.indexOf('\n') !== -1) {
    const math = h(node, 'div', { class: 'math block' }, [u('text', node.value)])
    return h(node, 'pre', [math])
  }
  return h(node, 'div', { class: 'math block' }, [
    u('text', node.value.replace(/\r?\n|\r/g, ' ')),
  ])
}

const inlineMath: Handler = (h, node) => {
  return h(node, 'span', { class: 'math inline' }, [
    u('text', node.value.replace(/\r?\n|\r/g, ' ')),
  ])
}

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
      ...opts?.handlers,
    },
  })
}
