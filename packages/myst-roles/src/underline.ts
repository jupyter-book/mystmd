import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const underlineRole: RoleSpec = {
  name: 'underline',
  alias: 'u',
  body: {
    type: ParseTypesEnum.parsed,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'underline', children: data.body as GenericNode[] }];
  },
};
