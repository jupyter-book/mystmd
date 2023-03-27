import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { CiteGroup } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { GenericNode } from 'myst-common';

/**
 * Add parentheses and separator text to citeGroup nodes as children
 *
 * This allows us to simply render children and get all the correct formatting.
 */
export function citeGroupTransform(mdast: Root) {
  const citeGroups = selectAll('citeGroup', mdast) as CiteGroup[];
  citeGroups.forEach((node) => {
    // Only run this transform if:
    // - there are children on the citeGroup and
    // - all citeGroup children are cite nodes
    if (!node.children.length || node.children.filter((child) => child.type !== 'cite').length) {
      return;
    }
    const { kind } = node;
    node.children.forEach((child) => {
      child.kind = kind;
    });
    const newChildren: GenericNode[] = [];
    if (kind === 'parenthetical') {
      newChildren.push({
        type: 'text',
        value: '(',
      });
    }
    newChildren.push(node.children[0]);
    const sep = kind === 'parenthetical' ? ';' : ',';
    node.children.slice(1).forEach((child) => {
      newChildren.push(
        {
          type: 'text',
          value: `${sep} `,
        },
        child,
      );
    });
    if (kind === 'parenthetical') {
      newChildren.push({
        type: 'text',
        value: ')',
      });
    }
    node.children = newChildren as any[];
  });
}

export const citeGroupPlugin: Plugin<[], Root, Root> = () => (tree) => {
  citeGroupTransform(tree);
};
