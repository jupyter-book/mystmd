import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const chemRole: RoleSpec = {
  name: 'chemicalFormula',
  alias: ['chem'],
  options: { ...commonRoleOptions('chemicalFormula') },
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const chem = { type: 'chemicalFormula', value: data.body as string };
    addCommonRoleOptions(data, chem);
    return [chem];
  },
};
