import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import type { PhrasingContent } from 'myst-spec';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const superscriptRole: RoleSpec = {
  name: 'superscript',
  alias: ['sup'],
  options: { ...commonRoleOptions('superscript') },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData) {
    const node = { type: 'superscript', children: data.body as PhrasingContent[] };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
