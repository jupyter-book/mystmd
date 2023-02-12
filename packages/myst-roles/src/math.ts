import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const mathRole: RoleSpec = {
  name: 'math',
  body: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'inlineMath', value: data.body as string }];
  },
};
