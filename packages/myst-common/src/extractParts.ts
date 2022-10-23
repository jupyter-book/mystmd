import type { Root } from 'mdast';
import type { Block } from 'myst-spec';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import { copyNode } from './utils';

/**
 * Selects the block node(s) based on part (string) or tags (string[]).
 */
export function selectBlockParts(tree: Root, part: string) {
  const blockParts = selectAll('block', tree).filter((block) => {
    if (!block.data?.tags && !block.data?.part) return false;
    if (block.data?.part === part) return true;
    try {
      return (block.data.tags as any).includes(part);
    } catch {
      return false;
    }
  });
  if (blockParts.length === 0) return undefined;
  return blockParts as Block[];
}

/**
 * Returns a copy of the block parts and removes them from the tree.
 */
export function extractPart(tree: Root, partId: string): Root | undefined {
  const blockParts = selectBlockParts(tree, partId);
  if (!blockParts) return undefined;
  const partsTree = { type: 'root', children: copyNode(blockParts) } as unknown as Root;
  // Remove the block parts from the main document
  blockParts.forEach((block) => {
    (block as any).type = '__delete__';
  });
  remove(tree, '__delete__');
  return partsTree;
}
