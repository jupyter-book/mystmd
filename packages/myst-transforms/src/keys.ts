import type { Plugin } from 'unified';
import type { Node } from 'myst-spec';
import { map } from 'unist-util-map';
import type { GenericParent } from 'myst-common';
import { createId } from 'myst-common';

function addKeys(node: Node) {
  if ((node as any).key) return;
  (node as any).key = createId();
  return node;
}

/**
 * Add unique keys to every node
 *
 * @param mdast
 * @returns
 */
export function keysTransform<T extends Node | GenericParent>(mdast: T): GenericParent | Node {
  return map(mdast as any, addKeys);
}

export const keysPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  keysTransform(tree);
};
