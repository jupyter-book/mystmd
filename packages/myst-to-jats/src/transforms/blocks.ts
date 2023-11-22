import type { Plugin } from 'unified';
import type { Block } from 'myst-spec-ext';
import type { GenericParent } from 'myst-common';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';

/**
 * This transform does the following:
 * - Removes hidden or removed blocks from the tree
 * - Removes hidden or removed outputs from the tree
 */
export function blockTransform(tree: GenericParent) {
  // This could also be an output, etc.
  (selectAll('[visibility=remove],[visibility=hide]', tree) as Block[]).forEach((node) => {
    if (node.visibility === 'remove' || node.visibility === 'hide') {
      (node as any).type = '__delete__';
    }
  });
  const removed = remove(tree, '__delete__');
  if (removed === null) {
    // remove is unhappy if all children are removed - this forces it through
    tree.children = [];
  }
}

export const blockPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  blockTransform(tree);
};
