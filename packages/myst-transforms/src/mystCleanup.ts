import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { liftChildren } from 'myst-common';

export function mystCleanupTransform(tree: Root) {
  liftChildren(tree, 'mystDirective');
  liftChildren(tree, 'mystRole');
}

export const mystCleanupPlugin: Plugin<[], Root, Root> = () => (tree) => {
  mystCleanupTransform(tree);
};
