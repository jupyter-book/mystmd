import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const deleteRole: RoleSpec = {
  name: 'delete',
  alias: ['del', 'strike'],
  body: {
    type: ParseTypesEnum.parsed,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'delete', children: data.body as GenericNode[] }];
  },
};
