import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const subscriptRole: RoleSpec = {
  name: 'subscript',
  alias: 'sub',
  body: {
    type: ParseTypesEnum.parsed,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'subscript', children: data.body as GenericNode[] }];
  },
};
