import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

const ABBR_PATTERN = /^(.+?)\(([^()]+)\)$/; // e.g. 'CSS (Cascading Style Sheets)'

export const abbreviationRole: RoleSpec = {
  name: 'abbreviation',
  alias: ['abbr'],
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const body = data.body as string;
    const match = ABBR_PATTERN.exec(body);
    const value = match?.[1]?.trim() ?? body.trim();
    const title = match?.[2]?.trim();
    return [{ type: 'abbreviation', title, children: [{ type: 'text', value }] }];
  },
};
