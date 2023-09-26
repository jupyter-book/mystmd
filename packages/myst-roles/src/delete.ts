import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const deleteRole: RoleSpec = {
  name: 'delete',
  alias: ['del', 'strike'],
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'delete', children: data.body as GenericNode[] }];
  },
};
