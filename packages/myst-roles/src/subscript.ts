import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const subscriptRole: RoleSpec = {
  name: 'subscript',
  alias: ['sub'],
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'subscript', children: data.body as GenericNode[] }];
  },
};
