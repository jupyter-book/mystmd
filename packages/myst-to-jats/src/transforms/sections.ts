import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Parent, Heading, Block } from 'myst-spec';
import { liftChildren, NotebookCell } from 'myst-common';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import type { Options } from '../types.js';

export type Section = Omit<Heading, 'type'> & { type: 'section'; meta?: string };

export function sectionAttrsFromBlock(node: { data?: Record<string, any>; identifier?: string }) {
  const output: { 'sec-type'?: string; id?: string } = {};
  if (node.data) {
    const blockType = node.data.type;
    if (Object.values(NotebookCell).includes(blockType)) {
      output['sec-type'] = blockType;
    }
  }
  if (node.identifier) output.id = node.identifier;
  return output;
}

function blockIsNotebookCode(node: Block) {
  // Markdown blocks will be divided to sections later by headings.
  return sectionAttrsFromBlock(node)['sec-type'] === NotebookCell.code;
}

function blockIsNotebookFigure(node: Block) {
  return !!node.data?.['fig-cap'];
}

function headingsToSections(tree: Root | Block, current?: Section) {
  const children: Parent[] = [];
  // let current: Section | undefined = undefined;
  function push(child: any) {
    if (current) {
      current.children.push(child);
    } else {
      children.push(child);
    }
  }

  function newSection(heading: Heading) {
    const { enumerator, enumerated, ...filtered } = heading;
    if (current && current.depth < heading.depth) {
      // Nest the section
      const next: Section = { ...filtered, type: 'section', children: [] };
      push(next);
      current = next;
      return { enumerator, enumerated };
    }
    current = { ...filtered, type: 'section', children: [] };
    children.push(current);
    return { enumerator, enumerated };
  }
  tree.children?.forEach((child) => {
    if (child.type === 'heading') {
      const { enumerator, enumerated } = newSection(child as Heading);
      push({ type: 'heading', enumerator, enumerated, children: child.children });
    } else {
      push(child);
    }
  });
  tree.children = children as any;
}

/**
 * This transform does the following:
 * - For sub-articles:
 *    - Blocks are converted to sections so notebook cell divisions are maintained.
 *    - Within each block, headers are converted to sections.
 * - For main articles:
 *    - Notebook code cell blocks (with meta.type of "notebook-code") are deleted.
 *    - Remaining blocks are removed, lifting children up a level
 *    - Top-level heading nodes are then used to break the tree into section nodes,
 *      with heading and subsequent nodes as children
 */
export function sectionTransform(tree: Root, opts: Options) {
  if (opts.isSubArticle) {
    (selectAll('block', tree) as Block[]).forEach((node) => {
      (node as any).type = 'section';
      (node as any).depth = 0;
      headingsToSections(node);
    });
    return;
  }
  (selectAll('block', tree) as Block[]).forEach((node) => {
    if (blockIsNotebookFigure(node)) {
      (node as any).type = 'section';
    } else if (blockIsNotebookCode(node)) {
      (node as any).type = '__delete__';
    }
  });
  const removed = remove(tree, '__delete__');
  if (removed === null) {
    // remove is unhappy if all children are removed - this forces it through
    tree.children = [];
  }
  liftChildren(tree, 'block'); // this looses part information. TODO: milestones
  headingsToSections(tree);
}

export const sectionPlugin: Plugin<[Options], Root, Root> = (opts) => (tree) => {
  sectionTransform(tree, opts);
};
