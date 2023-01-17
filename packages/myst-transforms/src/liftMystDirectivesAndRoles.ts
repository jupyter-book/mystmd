import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { liftChildren } from 'myst-common';

/**
 * Lift directives and roles and remove them from the tree
 *
 * Note, this should happen before `mystTargetsTransform`.
 *
 * @param tree The tree which is modified in place.
 */
export function liftMystDirectivesAndRolesTransform(tree: Root) {
  liftChildren(tree, 'mystDirective');
  liftChildren(tree, 'mystRole');
}

export const liftMystDirectivesAndRolesPlugin: Plugin<[], Root, Root> = () => (tree) => {
  liftMystDirectivesAndRolesTransform(tree);
};
