import type { VFile } from 'vfile';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Block, Node, Parent } from 'myst-spec';
import { select, selectAll } from 'unist-util-select';
import { fileError } from 'myst-common';

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

const TRANSFORM_SOURCE = 'BlockTransform:BlockMetadata';

export function blockMetadataTransform(mdast: Root, file: VFile) {
  const blocks = selectAll('block', mdast) as Block[];
  blocks.forEach((block) => {
    if (!block.meta) return;
    try {
      const data = JSON.parse(block.meta);
      block.data = data;
      delete block.meta;
    } catch (error) {
      fileError(file, 'Problem parsing JSON for block', { node: block, source: TRANSFORM_SOURCE });
    }
  });
}

export const blockMetadataPlugin: Plugin<[], Root, Root> = () => (tree, file) => {
  blockMetadataTransform(tree, file);
};
