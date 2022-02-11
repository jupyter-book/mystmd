import { Root } from 'mdast'
import { map } from 'unist-util-map'
import { visit } from 'unist-util-visit'
import { selectAll } from 'unist-util-select'
import classNames from 'classnames'
import { Admonition, GenericNode, AdmonitionKind } from './types'

type Transformer<T extends Record<string, string | undefined> = any> = {
  tag: string
  getProps?: (node: GenericNode<T>) => T
}

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

const mystToHastTransformers: Record<string, Transformer> = {
  abbreviation: {
    tag: 'abbr',
    getProps(node: any) {
      return { title: node.title }
    },
  },
  subscript: {
    tag: 'sub',
  },
  superscript: {
    tag: 'sup',
  },
  admonition: {
    tag: 'aside',
    getProps(node: GenericNode<Admonition>) {
      const className = node.class ? ` ${node.class}` : ''
      return {
        class:
          node.kind && node.kind !== AdmonitionKind.admonition
            ? `admonition ${node.kind}${className}`
            : `admonition${className}`,
      }
    },
  },
  admonitionTitle: {
    tag: 'p',
    getProps() {
      return { class: 'admonition-title' }
    },
  },
  container: {
    tag: 'figure',
    getProps(node) {
      return {
        id: node.name || undefined,
        class: classNames({ numbered: node.numbered }, node.class) || undefined,
      }
    },
  },
  caption: {
    tag: 'figcaption',
  },
  image: {
    tag: 'img',
    getProps(node) {
      return {
        src: node.url,
        alt: node.alt,
        title: node.title,
        class:
          classNames(node.align ? `align-${node.align}` : '', node.class) || undefined,
        width: node.width,
      }
    },
  },
}

export const mystToHast = () => (tree: Root) => {
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
      para.children = [
        {
          type: 'captionNumber',
          data: { hName: 'span', hProperties: { class: 'caption-number' } },
          children: [{ type: 'text', value: 'Figure 1' }],
        },
        ...(para.children ?? []),
      ]
    },
  )
  // Hoist up all paragraphs with a single image
  visit(tree, 'paragraph', (node: GenericNode) => {
    if (!(node.children?.length === 1 && node.children?.[0].type === 'image')) return
    const child = node.children[0]
    Object.keys(node).map((k) => {
      delete node[k]
    })
    Object.assign(node, child)
    delete node.children
  })
  return map(tree, (node: GenericNode) => {
    const transformer = mystToHastTransformers[node.type]
    if (!transformer) return node
    const data = node.data || (node.data = {})
    data.hName = transformer.tag
    data.hProperties = { ...data.hProperties, ...transformer.getProps?.(node) }
    return node
  })
}
