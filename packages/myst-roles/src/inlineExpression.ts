import type { InlineExpression } from 'myst-spec';
import type { RoleSpec, RoleData } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const evalRole: RoleSpec = {
  name: 'eval',
  options: { ...commonRoleOptions('eval') },
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData) {
    const node: InlineExpression = {
      type: 'inlineExpression',
      value: data.body as string,
      children: [],
    };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
