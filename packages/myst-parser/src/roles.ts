import type { Root } from 'mdast';
import { selectAll } from 'unist-util-select';
import type { RoleSpec } from './types';

export function applyRoles(tree: Root, roles: RoleSpec[]) {
  const roleNodes = selectAll('mystRole', tree);
}
