import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import { normalizeLabel, ParseTypesEnum } from 'myst-common';

export const citeRole: RoleSpec = {
  name: 'cite:p',
  alias: ['cite:t', 'cite'],
  body: {
    type: ParseTypesEnum.string,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const content = data.body as string;
    const labels = content.split(/[,;]/).map((s) => s.trim());
    const children = labels.map((l) => {
      const { label, identifier } = normalizeLabel(l) ?? {};
      return {
        type: 'cite',
        label: label ?? l,
        identifier,
      };
    });
    if (data.name === 'cite' && children.length === 1) {
      return children;
    }
    return [
      {
        type: 'citeGroup',
        kind: data.name === 'cite:p' ? 'parenthetical' : 'narrative',
        children,
      },
    ];
  },
};
