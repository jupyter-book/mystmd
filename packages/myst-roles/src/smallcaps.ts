import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const smallcapsRole: RoleSpec = {
  name: 'smallcaps',
  alias: ['sc'],
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'smallcaps', children: data.body as GenericNode[] }];
  },
};
