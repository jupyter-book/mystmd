import { GenericNode, map } from 'mystjs';
import { createId } from '@curvenote/schema';
import { MapResult } from './types';
import { Root } from '../myst';

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
export function transformKeys<T extends GenericNode | Root>(mdast: T): MapResult {
  return map(mdast, addKeys);
}
