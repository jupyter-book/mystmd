import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const underlineRole: RoleSpec = {
  name: 'underline',
  alias: ['u'],
  options: { ...commonRoleOptions('underline') },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData): {
    const node = { type: 'underline', children: data.body as GenericNode[] };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
