import type { Block } from 'myst-spec';
import type { GenericParent } from './types.js';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { copyNode } from './utils.js';

/**
 * Selects the block node(s) based on part (string) or tags (string[]).
 * If `part` is a string array, any of the parts will be treated equally.
 */
export function selectBlockParts(
  tree: GenericParent,
  part: string | string[],
): Block[] | undefined {
  if (!part) {
    // Prevent an undefined, null or empty part comparison
    return;
  }
  const blockParts = selectAll('block', tree).filter((block) => {
    const parts = typeof part === 'string' ? [part] : part;
    return parts
      .map((p) => {
        return (
          block.data?.part === p ||
          (block.data?.tags && Array.isArray(block.data.tags) && block.data.tags.includes(p))
        );
      })
      .reduce((a, b) => a || b, false);
  });
  if (blockParts.length === 0) return;
  return blockParts as Block[];
}

/**
 * Returns a copy of the block parts and removes them from the tree.
 */
export function extractPart(
  tree: GenericParent,
  part: string | string[],
  opts?: {
    /** Helpful for when we are doing recursions, we don't want to extract the part again. */
    removePartData?: boolean;
  },
): GenericParent | undefined {
  const partStrings = typeof part === 'string' ? [part] : part;
  const blockParts = selectBlockParts(tree, part);
  if (!blockParts) return undefined;
  const children = copyNode(blockParts).map((block) => {
    // Ensure the block always has the `part` defined, as it might be in the tags
    block.data ??= {};
    block.data.part = partStrings[0];
    if (
      block.data.tags &&
      Array.isArray(block.data.tags) &&
      block.data.tags.reduce((a, t) => a || partStrings.includes(t), false)
    ) {
      block.data.tags = block.data.tags.filter((tag) => !partStrings.includes(tag)) as string[];
      if ((block.data.tags as string[]).length === 0) {
        delete block.data.tags;
      }
    }
    if (opts?.removePartData) delete block.data.part;
    return block;
  });
  const partsTree = { type: 'root', children } as GenericParent;
  // Remove the block parts from the main document
  blockParts.forEach((block) => {
    (block as any).type = '__delete__';
  });
  remove(tree, '__delete__');
  return partsTree;
}
