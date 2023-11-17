import type { VFile } from 'vfile';
import type { Plugin } from 'unified';
import type { Node } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';
import { RuleId, fileError, normalizeLabel } from 'myst-common';
import type { Code } from 'myst-spec-ext';

function nestBlock(tree: GenericParent): void {
  const start = tree.children.findIndex((child) => (child.type as any) !== 'block');
  if (start === -1) return;
  const end = tree.children.findIndex((child, i) => (child.type as any) === 'block' && i > start);
  if (end === -1) {
    tree.children = [
      ...tree.children.slice(0, start),
      { type: 'block', children: tree.children.slice(start) as Node[] },
    ];
    return;
  }
  tree.children = [
    ...tree.children.slice(0, start),
    { type: 'block', children: tree.children.slice(start, end) as Node[] },
    ...tree.children.slice(end),
  ];
  nestBlock(tree);
}

export function blockNestingTransform(tree: GenericParent) {
  nestBlock(tree);
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
          ruleId: RuleId.blockMetadataLoads,
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

const defaultCaptionParser = (caption: string): GenericNode => {
  return {
    type: 'caption',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', value: caption }],
      },
    ],
  };
};

/**
 * If a block has a caption, nest the content in a figure with that caption
 */
export function blockToFigureTransform(mdast: GenericParent, captionParser = defaultCaptionParser) {
  const blocks = selectAll('block', mdast) as any[];
  blocks.forEach((block) => {
    const caption = block.data?.caption ?? block.data?.['fig-cap'];
    if (caption) {
      block.children = [
        {
          type: 'container',
          kind: 'figure',
          label: block.label,
          identifier: block.identifier,
          children: [...block.children, captionParser(caption)],
        },
      ];
      delete block.data.caption;
      delete block.data['fig-cap'];
      delete block.label;
      delete block.identifier;
    }
  });
}
