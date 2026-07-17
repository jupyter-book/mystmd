import { describe, expect, it } from 'vitest';
import { mystParse } from 'myst-parser';
import { iconRole, LEGACY_ICON_ALIASES } from '../src';
import { selectAll } from 'unist-util-select';

function deletePositions(tree: any) {
  selectAll('*', tree).forEach((n) => {
    delete n.position;
  });
  return tree;
}

describe('icon role', () => {
  it.each(['fab', 'far', 'fas', 'mtt', 'mrg', 'mrd', 'mol', 'msp', 'oct'])(
    'icon:%s role parses',
    async (kind) => {
      const role = `icon:${kind}`;
      const icon = 'any-icon';

      const markup = `{${role}}\`${icon}\``;

      const expected = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'mystRole',
                name: role,
                value: icon,
                children: [
                  {
                    type: 'icon',
                    kind: kind,
                    name: icon,
                  },
                ],
              },
            ],
          },
        ],
      };
      const output = mystParse(markup, {
        roles: [iconRole],
      });
      expect(deletePositions(output)).toEqual(expected);
    },
  );
  it.each(Object.entries(LEGACY_ICON_ALIASES))(
    'legacy %s role parses',
    async (legacyName, kind) => {
      const icon = 'any-icon';

      const markup = `{${legacyName}}\`${icon}\``;

      const expected = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'mystRole',
                name: legacyName,
                value: icon,
                children: [
                  {
                    type: 'icon',
                    kind: kind,
                    name: icon,
                  },
                ],
              },
            ],
          },
        ],
      };
      const output = mystParse(markup, {
        roles: [iconRole],
      });
      expect(deletePositions(output)).toEqual(expected);
    },
  );
});
