import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { GenericNode } from 'myst-common';
import { liftChildren } from 'myst-common';
import { selectAll } from 'unist-util-select';

/**
 * Lift directives and roles and remove them from the tree
 *
 * Note, this should happen before `mystTargetsTransform`.
 *
 * @param tree The tree which is modified in place.
 */
export function liftMystDirectivesAndRolesTransform(tree: Root) {
  const directives = selectAll('mystDirective,mystRole', tree) as GenericNode[];
  directives.forEach((n) => {
    const child = n.children?.[0];
    if (!child) return;
    if (n.identifier && !child.identifier) {
      child.identifier = n.identifier;
      child.label = n.label;
      child.html_id = n.html_id;
    }
  });
  liftChildren(tree, 'mystDirective');
  liftChildren(tree, 'mystRole');
}

export const liftMystDirectivesAndRolesPlugin: Plugin<[], Root, Root> = () => (tree) => {
  liftMystDirectivesAndRolesTransform(tree);
};
