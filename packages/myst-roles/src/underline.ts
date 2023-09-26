import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const underlineRole: RoleSpec = {
  name: 'underline',
  alias: ['u'],
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'underline', children: data.body as GenericNode[] }];
  },
};
