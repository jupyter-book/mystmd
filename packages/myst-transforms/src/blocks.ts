import type { VFile } from 'vfile';
import type { Plugin } from 'unified';
import type { Node, Parent } from 'myst-spec';
import { select, selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';
import { fileError, normalizeLabel } from 'myst-common';
import type { Code } from 'myst-spec-ext';

export function blockNestingTransform(mdast: GenericParent) {
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

export const blockNestingPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  blockNestingTransform(tree);
};

const TRANSFORM_SOURCE = 'BlockTransform:BlockMetadata';

export function blockMetadataTransform(mdast: GenericParent, file: VFile) {
  const blocks = selectAll('block', mdast) as any[];
  blocks.forEach((block) => {
    if (block.meta) {
      try {
        const data = JSON.parse(block.meta);
        block.data = block.data ? { ...block.data, ...data } : data;
        delete block.meta;
      } catch (error) {
        fileError(file, 'Problem parsing JSON for block', {
          node: block,
          source: TRANSFORM_SOURCE,
        });
      }
    }
    const label = block.data?.label ?? block.data?.id;
    if (typeof label === 'string') {
      const normalized = normalizeLabel(label);
      if (normalized) {
        // TODO: raise error if the node is already labelled
        block.identifier = normalized.identifier;
        block.label = normalized.label;
        block.html_id = normalized.html_id;
        delete block.data.label;
      }
    }
    if (block.identifier) {
      const codeChildren = selectAll('code', block) as Code[];
      codeChildren.forEach((child, index) => {
        if (child.identifier) return;
        if (codeChildren.length === 1) {
          child.identifier = `${block.identifier}-code`;
        } else {
          child.identifier = `${block.identifier}-code-${index}`;
        }
      });
      const outputChildren = selectAll('output', block) as GenericNode[];
      outputChildren.forEach((child, index) => {
        if (child.identifier) return;
        if (outputChildren.length === 1) {
          child.identifier = `${block.identifier}-output`;
        } else {
          child.identifier = `${block.identifier}-output-${index}`;
        }
      });
    }
  });
}

export const blockMetadataPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree, file) => {
  blockMetadataTransform(tree, file);
};
