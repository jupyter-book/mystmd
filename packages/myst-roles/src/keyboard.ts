import type { GenericNode, RoleSpec } from 'myst-common';

export const keyboardRole: RoleSpec = {
  name: 'keyboard',
  alias: ['kbd'],
  body: {
    type: String,
    required: true,
  },
  run(data) {
    const body = data.body as string;
    const link: GenericNode = { type: 'keyboard', value: body };
    return [link];
  },
};
