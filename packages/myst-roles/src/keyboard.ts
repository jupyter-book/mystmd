import type { RoleSpec } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';
import type { Keyboard } from 'myst-spec';

export const keyboardRole: RoleSpec = {
  name: 'keyboard',
  doc: 'The keyboard role denote textual user input from a keyboard, such as "Ctrl" + "Space".',
  alias: ['kbd'],
  options: { ...commonRoleOptions('keyboard') },
  body: {
    type: String,
    required: true,
  },
  run(data) {
    const node: Keyboard = {
      type: 'keyboard',
      children: [{ type: 'text', value: data.body as string }],
    };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
