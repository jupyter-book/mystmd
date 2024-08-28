import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const iconRole: RoleSpec = {
  name: 'icon:oct',
  alias: [
    'icon:mrg',
    'icon:mol',
    'icon:mrd',
    'icon:msp',
    'icon:mtt',
    'icon:fab',
    'icon:far',
    'icon:fas',
  ],
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const kindMatch = (data.name as string).match(/icon:(.*)/)!;
    const kind = kindMatch[1];
    const name = data.body as string;
    const icon = {
      type: 'icon',
      kind,
      name,
    };
    return [icon];
  },
};
