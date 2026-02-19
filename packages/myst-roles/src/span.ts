import type { RoleSpec, RoleData } from 'myst-common';
import type { Span, PhrasingContent } from 'myst-spec';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const spanRole: RoleSpec = {
  name: 'span',
  options: { ...commonRoleOptions('span') },
  body: {
    type: 'myst',
  },
  run(data: RoleData) {
    const node: Span = {
      type: 'span',
      children: data.body ? (data.body as PhrasingContent[]) : [],
    };

    addCommonRoleOptions(data, node);
    return [node];
  },
};
