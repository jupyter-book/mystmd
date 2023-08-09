import type { Plugin } from 'unified';
import type { Node } from 'myst-spec';
import { map } from 'unist-util-map';
import type { GenericParent } from 'myst-common';

/**
 * Ensure all HTML ids in the document are unique
 *
 * @param mdast
 * @returns
 */
export function htmlIdsTransform<T extends Node | GenericParent>(mdast: T) {
  const ids = new Set();
  map(mdast as any, (node: Node & { html_id?: string }) => {
    if (!node.html_id) return;
    if (!ids.has(node.html_id)) {
      ids.add(node.html_id);
      return;
    }
    const original = node.html_id;
    let number = 1;
    let next = `${original}-${number}`;
    while (ids.has(next)) {
      number += 1;
      next = `${original}-${number}`;
    }
    node.html_id = next;
    ids.add(node.html_id);
    return node;
  });
}

export const htmlIdsPlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  htmlIdsTransform(tree);
};
