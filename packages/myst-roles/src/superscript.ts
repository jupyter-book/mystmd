import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const superscriptRole: RoleSpec = {
  name: 'superscript',
  alias: 'sup',
  body: {
    type: ParseTypesEnum.parsed,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'superscript', children: data.body as GenericNode[] }];
  },
};
