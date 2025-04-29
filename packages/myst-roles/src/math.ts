import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const mathRole: RoleSpec = {
  name: 'math',
  options: { ...commonRoleOptions('math') },
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const node: GenericNode = { type: 'inlineMath', value: data.body as string };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
