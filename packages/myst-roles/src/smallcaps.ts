import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const smallcapsRole: RoleSpec = {
  name: 'smallcaps',
  alias: 'sc',
  body: {
    type: ParseTypesEnum.parsed,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'smallcaps', children: data.body as GenericNode[] }];
  },
};
