import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const chemRole: RoleSpec = {
  name: 'chemicalFormula',
  alias: ['chem'],
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'chemicalFormula', value: data.body as string }];
  },
};
