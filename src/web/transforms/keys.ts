import { createId } from '@curvenote/schema';
import { GenericNode, map } from 'mystjs';
import { Root } from './types';

function addKeys(node: GenericNode) {
  node.key = createId();
  return node;
}

/**
 * Add unique keys to every node
 *
 * @param mdast
 * @returns
 */
export function transformKeys<T extends GenericNode | Root>(mdast: T) {
  return map(mdast, addKeys);
}
