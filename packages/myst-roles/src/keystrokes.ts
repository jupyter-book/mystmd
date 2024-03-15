import type { GenericNode, RoleSpec } from 'myst-common';

export const keystrokesRole: RoleSpec = {
  name: 'keystrokes',
  alias: ['kbd'],
  body: {
    type: String,
    required: true,
  },
  run(data) {
    const body = data.body as string;
    const link: GenericNode = { type: 'keystrokes', value: body };
    return [link];
  },
};
