import type { Plugin } from 'unified';
import type { GenericNode, GenericParent } from 'myst-common';
import { liftChildren, transferTargetAttrs } from 'myst-common';
import { selectAll } from 'unist-util-select';

/**
 * Lift directives and roles and remove them from the tree
 *
 * Note, this should happen before `mystTargetsTransform`.
 *
 * @param tree The tree which is modified in place.
 */
export function liftMystDirectivesAndRolesTransform(tree: GenericParent) {
  const directives = selectAll('mystDirective,mystRole', tree) as GenericNode[];
  directives.forEach((n) => {
    const child = n.children?.[0];
    if (!child) return;
    if (child.identifier) {
      delete n.identifier;
      delete n.label;
      delete n.html_id;
    }
    transferTargetAttrs(n, child);
  });
  liftChildren(tree, 'mystDirective');
  liftChildren(tree, 'mystRole');
}

export const liftMystDirectivesAndRolesPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree) => {
    liftMystDirectivesAndRolesTransform(tree);
  };
