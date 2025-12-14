import type { RoleSpec, RoleData } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';
import type { Subscript, PhrasingContent } from 'myst-spec';

export const subscriptRole: RoleSpec = {
  name: 'subscript',
  alias: ['sub'],
  options: { ...commonRoleOptions('subscript') },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData) {
    const node: Subscript = { type: 'subscript', children: data.body as PhrasingContent[] };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
