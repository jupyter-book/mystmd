import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const superscriptRole: RoleSpec = {
  name: 'superscript',
  alias: ['sup'],
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'superscript', children: data.body as GenericNode[] }];
  },
};
