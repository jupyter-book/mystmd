import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Parent, Heading, Block } from 'myst-spec';
import { liftChildren, NotebookCell } from 'myst-common';
import { remove } from 'unist-util-remove';
import { selectAll } from 'unist-util-select';
import type { Options } from '../types';

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

/**
 * This transform does the following:
 * - For sub-articles:
 *    - Blocks are converted directly to sections with no additional transformation.
 *    - This means notebook cell divisions are maintained.
 *    - However, markdown sub-articles do not get divided into sections by header.
 * - For main articles:
 *    - Notebook code cell blocks (with meta.type of "notebook-code") are removed.
 *    - Remaining blocks are removed, lifting children up a level
 *    - Top-level heading nodes are then used to break the tree into section nodes,
 *      with heading and subsequent nodes as children
 */
export function sectionTransform(tree: Root, opts: Options) {
  if (opts.isSubArticle) {
    (selectAll('block', tree) as Block[]).forEach((node) => {
      (node as any).type = 'section';
    });
    return;
  }
  (selectAll('block', tree) as Block[]).forEach((node) => {
    if (blockIsNotebookCode(node)) (node as any).type = '_remove';
  });
  remove(tree, '_remove');
  liftChildren(tree, 'block'); // this looses part information. TODO: milestones
  const children: Parent[] = [];
  let current: Section | undefined = undefined;
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
  tree.children.forEach((child) => {
    if (child.type === 'heading') {
      const { enumerator, enumerated } = newSection(child as Heading);
      push({ type: 'heading', enumerator, enumerated, children: child.children });
    } else {
      push(child);
    }
  });
  tree.children = children as any;
}

export const sectionPlugin: Plugin<[Options], Root, Root> = (opts) => (tree) => {
  sectionTransform(tree, opts);
};
