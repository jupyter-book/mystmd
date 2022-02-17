import { Root } from 'mdast'
import { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { selectAll } from 'unist-util-select'
import { Admonition, AdmonitionKind, GenericNode } from './types'
import { admonitionKindToTitle } from './utils'

export type Options = {
  addAdmonitionHeaders?: boolean
  addContainerCaptionNumbers?: boolean
}

const defaultOptions: Record<keyof Options, true> = {
  addAdmonitionHeaders: true,
  addContainerCaptionNumbers: true,
}

// Visit all admonitions and add headers if necessary
export function addAdmonitionHeaders(tree: Root) {
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
}

// Visit all containers and add captions
export function addContainerCaptionNumbers(tree: Root) {
  selectAll('container[numbered=true] caption > paragraph', tree).forEach(
    (para: GenericNode) => {
      para.children = [{ type: 'captionNumber' }, ...(para.children ?? [])]
    },
  )
}

export const transform: Plugin<[Options?], string, Root> = (o) => (tree: Root) => {
  const opts = {
    ...defaultOptions,
    ...o,
  }
  if (opts.addAdmonitionHeaders) addAdmonitionHeaders(tree)
  if (opts.addContainerCaptionNumbers) addContainerCaptionNumbers(tree)
}
