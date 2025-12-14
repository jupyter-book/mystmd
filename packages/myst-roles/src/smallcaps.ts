import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const smallcapsRole: RoleSpec = {
  name: 'smallcaps',
  alias: ['sc'],
  options: { ...commonRoleOptions('smallcaps') },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData): {
    const node = { type: 'smallcaps', children: data.body as GenericNode[] };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
