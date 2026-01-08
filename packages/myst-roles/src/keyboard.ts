import type { GenericNode, RoleSpec } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const keyboardRole: RoleSpec = {
  name: 'keyboard',
  doc: 'The keyboard role denote textual user input from a keyboard, such as "Ctrl" + "Space". See [](#role:keyboard-input).',
  alias: ['kbd'],
  options: { ...commonRoleOptions('keyboard') },
  body: {
    type: String,
    required: true,
  },
  run(data) {
    const node: GenericNode = {
      type: 'keyboard',
      children: [{ type: 'text', value: data.body as string }],
    };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
