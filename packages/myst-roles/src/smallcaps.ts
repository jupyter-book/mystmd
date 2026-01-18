import type { RoleSpec, RoleData } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';
import type { SmallCaps, PhrasingContent } from 'myst-spec';

export const smallcapsRole: RoleSpec = {
  name: 'smallcaps',
  alias: ['sc'],
  options: { ...commonRoleOptions('smallcaps') },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData) {
    const node: SmallCaps = { type: 'smallcaps', children: data.body as PhrasingContent[] };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
