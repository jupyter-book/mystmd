import type { InlineExpression } from 'myst-spec-ext';
import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const evalRole: RoleSpec = {
  name: 'eval',
  options: { ...commonRoleOptions('eval') },
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const node: InlineExpression = { type: 'inlineExpression', value: data.body as string };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
