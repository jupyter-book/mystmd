import type { RoleSpec, RoleData } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';
import type { ChemicalFormula } from 'myst-spec';

export const chemRole: RoleSpec = {
  name: 'chemicalFormula',
  alias: ['chem'],
  options: { ...commonRoleOptions('chemicalFormula') },
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData) {
    const chem: ChemicalFormula = { type: 'chemicalFormula', value: data.body as string };
    addCommonRoleOptions(data, chem);
    return [chem];
  },
};
