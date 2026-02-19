import type { RoleSpec, RoleData } from 'myst-common';
import type { Underline, PhrasingContent } from 'myst-spec';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const underlineRole: RoleSpec = {
  name: 'underline',
  alias: ['u'],
  options: { ...commonRoleOptions('underline') },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData) {
    const node: Underline = { type: 'underline', children: data.body as PhrasingContent[] };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
