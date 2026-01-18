import type { RoleSpec, RoleData } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';
import type { Delete, PhrasingContent } from 'myst-spec';

export const deleteRole: RoleSpec = {
  name: 'delete',
  alias: ['del', 'strike'],
  options: { ...commonRoleOptions('delete') },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData) {
    const del: Delete = { type: 'delete', children: data.body as PhrasingContent[] };
    addCommonRoleOptions(data, del);
    return [del];
  },
};
