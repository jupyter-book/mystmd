import { Root } from 'mdast'
import { map } from 'unist-util-map'

type Transformer = {
  tag: string
  getProps: (node: any) => Record<string, string>
}

const mystToHastTransformers: Record<string, Transformer> = {
  abbr: {
    tag: 'abbr',
    getProps(node: any) {
      return { title: node.title }
    },
  },
}

export const mystToHast = () => (tree: Root) => {
  map(tree, (node: any) => {
    const transformer = mystToHastTransformers[node.type]
    if (!transformer) return node
    const data = node.data || (node.data = {})
    data.hName = transformer.tag
    data.hProperties = { ...data.hProperties, ...transformer.getProps(node) }
    return node
  })
}
