import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';

const ABBR_PATTERN = /^(.+?)\(([^()]+)\)$/; // e.g. 'CSS (Cascading Style Sheets)'

export const abbreviationRole: RoleSpec = {
  name: 'abbreviation',
  alias: ['abbr'],
  doc: 'Create an abbreviation with hover-tooltip and accessibility improvements. See [](#abbr-role).',
  options: { ...commonRoleOptions('abbreviation') },
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const body = data.body as string;
    const match = ABBR_PATTERN.exec(body);
    const value = match?.[1]?.trim() ?? body.trim();
    const title = match?.[2]?.trim();
    const abbr = { type: 'abbreviation', title, children: [{ type: 'text', value }] };
    addCommonRoleOptions(data, abbr);
    return [abbr];
  },
};
