import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { ParseTypesEnum } from 'myst-common';

export const chemRole: RoleSpec = {
  name: 'chemicalFormula',
  alias: 'chem',
  body: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    return [{ type: 'chemicalFormula', value: data.body as string }];
  },
};
