import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const deleteRole: RoleSpec = {
  name: 'delete',
  alias: ['del', 'strike'],
  options: { ...commonRoleOptions('delete') },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const del = { type: 'delete', children: data.body as GenericNode[] };
    addCommonRoleOptions(data, del);
    return [del];
  },
};
