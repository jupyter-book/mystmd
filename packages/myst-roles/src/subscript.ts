import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const subscriptRole: RoleSpec = {
  name: 'subscript',
  alias: ['sub'],
  doc: 'Format text as subscript. See [](#role:subscript-superscript).',
  options: { ...commonRoleOptions('subscript') },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const node = { type: 'subscript', children: data.body as GenericNode[] };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
