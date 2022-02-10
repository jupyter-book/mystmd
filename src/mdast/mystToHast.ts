import { Root } from 'mdast'
import { map } from 'unist-util-map'
import { visit } from 'unist-util-visit'
import { GenericNode } from '.'

type Transformer = {
  tag: string
  getProps: (node: GenericNode) => Record<string, string>
}

type Admonition = GenericNode<{
  kind: AdmonitionKind
  class: string
}>

enum AdmonitionKind {
  admonition = 'admonition',
  attention = 'attention',
  caution = 'caution',
  danger = 'danger',
  error = 'error',
  important = 'important',
  hint = 'hint',
  note = 'note',
  seealso = 'seealso',
  tip = 'tip',
  warning = 'warning',
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
  abbr: {
    tag: 'abbr',
    getProps(node: any) {
      return { title: node.title }
    },
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
  return map(tree, (node: GenericNode) => {
    const transformer = mystToHastTransformers[node.type]
    if (!transformer) return node
    const data = node.data || (node.data = {})
    data.hName = transformer.tag
    data.hProperties = { ...data.hProperties, ...transformer.getProps(node) }
    return node
  })
}
