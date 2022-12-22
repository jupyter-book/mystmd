import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Caption, PhrasingContent } from 'myst-spec';
import { visit } from 'unist-util-visit';

/**
 * Ensure caption content is nested in a paragraph.
 *
 * This function is idempotent.
 */
export function captionParagraphTransform(tree: Root) {
  visit(tree, 'caption', (node: Caption) => {
    if (node.children && node.children[0]?.type !== 'paragraph') {
      node.children = [{ type: 'paragraph', children: node.children as PhrasingContent[] }];
    }
  });
}

export const captionParagraphPlugin: Plugin<[], Root, Root> = () => (tree) => {
  captionParagraphTransform(tree);
};
