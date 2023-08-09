import type { Plugin } from 'unified';
import type { Caption, PhrasingContent } from 'myst-spec';
import { visit } from 'unist-util-visit';
import type { GenericParent } from 'myst-common';

/**
 * Ensure caption content is nested in a paragraph.
 *
 * This function is idempotent.
 */
export function captionParagraphTransform(tree: GenericParent) {
  visit(tree, 'caption', (node: Caption) => {
    if (node.children && node.children[0]?.type !== 'paragraph') {
      node.children = [
        { type: 'paragraph', children: node.children as PhrasingContent[] },
      ] as any[];
    }
  });
}

export const captionParagraphPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  captionParagraphTransform(tree);
};
