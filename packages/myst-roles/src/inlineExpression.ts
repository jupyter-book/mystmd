import type { InlineExpression } from 'myst-spec-ext';
import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const evalRole: RoleSpec = {
  name: 'eval',
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const value = data.body as string;
    const node: InlineExpression = {
      type: 'inlineExpression',
      value,
    };
    return [node];
  },
};
