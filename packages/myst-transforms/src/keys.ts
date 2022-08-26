import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Node } from 'myst-spec';
import { map } from 'unist-util-map';
import { createId } from './utils';

function addKeys(node: Node) {
  (node as any).key = createId();
  return node;
}

/**
 * Add unique keys to every node
 *
 * @param mdast
 * @returns
 */
export function keysTransform<T extends Node | Root>(mdast: T): Root | Node {
  return map(mdast as any, addKeys);
}

export const keysPlugin: Plugin<[], Root, Root> = () => (tree) => {
  keysTransform(tree);
};
