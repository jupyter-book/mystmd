import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

export const LEGACY_ICON_ALIASES: Record<string, string> = {
  octicon: 'oct',
  fas: 'fas',
  far: 'far',
  fab: 'fab',
  'material-twotone': 'mtt',
  'material-sharp': 'msp',
  'material-regular': 'mrg',
  'material-round': 'mrd',
  'material-outline': 'mol',
};

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
    ...Object.keys(LEGACY_ICON_ALIASES),
  ],
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    let kind: string;

    const roleName = data.name as string;
    const alias = LEGACY_ICON_ALIASES[roleName];

    if (alias !== undefined) {
      kind = alias;
    } else {
      const kindMatch = (data.name as string).match(/icon:(.*)/)!;
      kind = kindMatch[1];
    }
    const name = data.body as string;
    const icon = {
      type: 'icon',
      kind,
      name,
    };
    return [icon];
  },
};
