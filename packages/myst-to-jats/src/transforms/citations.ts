import type { Plugin } from 'unified';
import type { CiteGroup } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';

/**
 * Add <sup> tag and separator text to citeGroup with nodes as children
 *
 * This allows us to simply render children and get all the correct formatting.
 */
export function citeGroupTransform(mdast: GenericParent) {
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
    const wrapper: GenericNode = { type: 'superscript', children: [] };
    wrapper.children = [];

    wrapper.children.push(node.children[0]);
    const sep = kind === 'parenthetical' ? ';' : ',';
    node.children.slice(1).forEach((child) => {
      wrapper.children!.push(
        {
          type: 'text',
          value: `${sep} `,
        },
        child,
      );
    });
    node.children = kind == 'parenthetical' ? ([wrapper] as any[]) : wrapper.children;
  });
}

export const citeGroupPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  citeGroupTransform(tree);
};
