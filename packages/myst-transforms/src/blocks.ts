import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Node, Parent } from 'myst-spec';
import { select } from 'unist-util-select';

export function blockNestingTransform(mdast: Root) {
  if (!select('block', mdast)) {
    const blockNode = { type: 'block', children: mdast.children as Node[] };
    (mdast as Parent).children = [blockNode];
    return;
  }
  if ((mdast.children[0].type as any) !== 'block') {
    // There are some blocks, but the first one is not!
    // Lift the content until the first block into a block
    const index = mdast.children.findIndex((child) => (child.type as any) === 'block');
    const firstBlock = { type: 'block', children: mdast.children.slice(0, index) as Node[] };
    const otherBlocks = mdast.children.slice(index) as Parent[];
    (mdast as Parent).children = [firstBlock, ...otherBlocks];
  }
}

export const blockNestingPlugin: Plugin<[], Root, Root> = () => (tree) => {
  blockNestingTransform(tree);
};
