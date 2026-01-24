import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

export const superscriptRole: RoleSpec = {
  name: 'superscript',
  alias: ['sup'],
  doc: 'Format text as superscript. See [](#role:subscript-superscript).',
  options: { ...commonRoleOptions('superscript') },
  body: {
    type: 'myst',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const node = { type: 'superscript', children: data.body as GenericNode[] };
    addCommonRoleOptions(data, node);
    return [node];
  },
};
