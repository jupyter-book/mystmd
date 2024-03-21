import type { GenericNode, RoleSpec } from 'myst-common';

export const keyboardRole: RoleSpec = {
  name: 'keyboard',
  doc: 'The keyboard role denote textual user input from a keyboard, such as "Ctrl" + "Space".',
  alias: ['kbd'],
  body: {
    type: String,
    required: true,
  },
  run(data) {
    const body = data.body as string;
    const node: GenericNode = {
      type: 'keyboard',
      children: [{ type: 'text', value: body }],
    };
    return [node];
  },
};
