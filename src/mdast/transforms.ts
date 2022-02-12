import { Root } from 'mdast'
import { Plugin } from 'unified'
import { visit } from 'unist-util-visit'
import { selectAll } from 'unist-util-select'
import { Admonition, AdmonitionKind, GenericNode } from './types'
import { admonitionKindToTitle } from './utils'

export type Options = {
  addAdmonitionHeaders?: boolean
  addContainerCaptionNumbers?: boolean
  hoistSingleImagesOutofParagraphs?: boolean
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

export function hoistSingleImagesOutofParagraphs(tree: Root) {
  // Hoist up all paragraphs with a single image
  visit(tree, 'paragraph', (node: GenericNode) => {
    if (!(node.children?.length === 1 && node.children?.[0].type === 'image')) return
    const child = node.children[0]
    Object.keys(node).forEach((k) => {
      delete node[k]
    })
    Object.assign(node, child)
  })
}

const defaultOptions: Record<keyof Options, true> = {
  addAdmonitionHeaders: true,
  addContainerCaptionNumbers: true,
  hoistSingleImagesOutofParagraphs: true,
}

export const transform: Plugin<[Options?], string, Root> = (o) => (tree: Root) => {
  const opts = {
    ...defaultOptions,
    ...o,
  }
  if (opts.addAdmonitionHeaders) addAdmonitionHeaders(tree)
  if (opts.addContainerCaptionNumbers) addContainerCaptionNumbers(tree)
  if (opts.hoistSingleImagesOutofParagraphs) hoistSingleImagesOutofParagraphs(tree)
}
