import type { GenericNode } from 'mystjs';
import { select } from 'mystjs';
import type { Root } from '../myst';

export function ensureBlockNesting(mdast: Root) {
  if (!select('block', mdast)) {
    const blockNode = { type: 'block', children: mdast.children as GenericNode[] };
    (mdast as GenericNode).children = [blockNode];
    return;
  }
  if ((mdast.children[0].type as any) !== 'block') {
    // There are some blocks, but the first one is not!
    // Lift the content until the first block into a block
    const index = mdast.children.findIndex((child) => (child.type as any) === 'block');
    const firstBlock = { type: 'block', children: mdast.children.slice(0, index) as GenericNode[] };
    const otherBlocks = mdast.children.slice(index) as GenericNode[];
    (mdast as GenericNode).children = [firstBlock, ...otherBlocks];
  }
}
