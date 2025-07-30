import type { VFile } from 'vfile';
import type { Plugin } from 'unified';
import type { Node } from 'myst-spec';
import { selectAll, select } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';
import { NotebookCell, RuleId, fileError, normalizeLabel } from 'myst-common';
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

    // Customiseable kind
    const kind = block.data?.kind;
    if (kind) {
      block.kind = kind;
      delete block.data.kind;
    }

    // Customiseable class
    if (typeof block.data?.class === 'string') {
      block.class = `${block.class ?? ''} ${block.data.class}`.trim();
      delete block.data.class;
    }

    // Minor cleanup
    if (block.data && Object.keys(block.data).length === 0) delete block.data;

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
      const codeNode = select('code', block) as any as Code | null;
      if (codeNode !== null && !codeNode.identifier) {
        codeNode.identifier = `${block.identifier}-code`;
      }
      const outputsNode = select('outputs', block) as GenericNode | null;
      if (outputsNode !== null && !outputsNode.identifier) {
        // Label outputs node
        outputsNode.identifier = `${block.identifier}-outputs`;
        // Enumerate outputs
        const outputs = selectAll('output', outputsNode) as GenericNode[];
        outputs.forEach((outputNode, index) => {
          if (outputNode && !outputNode.identifier) {
            outputNode.identifier = `${block.identifier}-output-${index}`;
          }
        });
      }
    }
  });
}

export const blockMetadataPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree, file) => {
  blockMetadataTransform(tree, file);
};

const defaultParser = (caption: string): GenericParent => {
  return {
    type: 'root',
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
export function blockToFigureTransform(
  mdast: GenericParent,
  opts?: { parser?: (caption: string) => GenericNode },
) {
  const blocks = selectAll('block', mdast) as any[];
  const parser = opts?.parser ?? defaultParser;
  blocks.forEach((block) => {
    const caption = block.data?.caption ?? block.data?.['fig-cap'] ?? block.data?.['tbl-cap'];
    if (caption) {
      const kind = block.data?.kind ?? (block.data?.['tbl-cap'] ? 'table' : 'figure');
      const children = typeof caption === 'string' ? parser(caption).children ?? [] : caption;
      children.push(...block.children);
      const container: GenericParent = {
        type: 'container',
        kind,
        label: block.label,
        identifier: block.identifier,
        children,
      };
      if (block.kind === NotebookCell.code) {
        container.noSubcontainers = true;
      }
      block.children = [container];
      delete block.data.caption;
      delete block.data['fig-cap'];
      delete block.data['tbl-cap'];
      delete block.data.kind;
      delete block.label;
      delete block.identifier;
    }
  });
}
