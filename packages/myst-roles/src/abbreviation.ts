import type { RoleSpec, RoleData } from 'myst-common';
import { addCommonRoleOptions, commonRoleOptions } from './utils.js';
import type { Abbreviation } from 'myst-spec';

const ABBR_PATTERN = /^(.+?)\(([^()]+)\)$/; // e.g. 'CSS (Cascading Style Sheets)'

export const abbreviationRole: RoleSpec = {
  name: 'abbreviation',
  alias: ['abbr'],
  options: { ...commonRoleOptions('abbreviation') },
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData) {
    const body = data.body as string;
    const match = ABBR_PATTERN.exec(body);
    const value = match?.[1]?.trim() ?? body.trim();
    const title = match?.[2]?.trim();
    const abbr: Abbreviation = { type: 'abbreviation', title, children: [{ type: 'text', value }] };
    addCommonRoleOptions(data, abbr);
    return [abbr];
  },
};
