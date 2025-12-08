import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const spanRole: RoleSpec = {
  name: 'span',
  options: { ...commonRoleOptions('span') },
  body: {
    type: 'myst',
  },
  run(data: RoleData): GenericNode[] {
    const node: GenericNode = { type: 'span' };
    if (data.body) {
      node.children = data.body as GenericNode[];
    }
    addCommonRoleOptions(data, node);
    return [node];
  },
};
