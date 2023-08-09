import type { Block } from 'myst-spec';
import type { GenericParent } from './types.js';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { copyNode } from './utils.js';

/**
 * Selects the block node(s) based on part (string) or tags (string[]).
 */
export function selectBlockParts(tree: GenericParent, part: string): Block[] | undefined {
  if (!part) {
    // Prevent an undefined, null or empty part comparison
    return;
  }
  const blockParts = selectAll('block', tree).filter((block) => {
    return (
      block.data?.part === part ||
      (block.data?.tags && Array.isArray(block.data.tags) && block.data.tags.includes(part))
    );
  });
  if (blockParts.length === 0) return;
  return blockParts as Block[];
}

/**
 * Returns a copy of the block parts and removes them from the tree.
 */
export function extractPart(tree: GenericParent, part: string): GenericParent | undefined {
  const blockParts = selectBlockParts(tree, part);
  if (!blockParts) return undefined;
  const children = copyNode(blockParts).map((block) => {
    // Ensure the block always has the `part` defined, as it might be in the tags
    block.data ??= {};
    block.data.part = part;
    if (block.data.tags && Array.isArray(block.data.tags) && block.data.tags.includes(part)) {
      block.data.tags = block.data.tags.filter((tag) => tag !== part) as string[];
      if ((block.data.tags as string[]).length === 0) {
        delete block.data.tags;
      }
    }
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
