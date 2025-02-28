import { describe, expect, test } from 'vitest';
import { normalizeLabel, type GenericNode, type RoleData, type RoleSpec } from 'myst-common';
import { mystParse } from '../../src';
import { position, positionFn } from '../position';

describe('custom role extensions', () => {
  test('test role with string body', () => {
    const TestRole: RoleSpec = {
      name: 'span',
      body: {
        type: 'myst',
      },
      options: {
        label: {
          type: String,
          alias: ['name'],
        },
        class: {
          type: String,
        },
        open: {
          type: Boolean,
        },
        max: {
          type: Number,
        },
        title: {
          type: 'myst',
        },
      },
      run(data: RoleData) {
        const { label, identifier } =
          normalizeLabel(data.options?.label as string | undefined) || {};
        return [
          {
            type: 'span',
            label,
            identifier,
            class: data.options?.class,
            open: data.options?.open ?? false,
            max: data.options?.max ?? 10,
            children: data.body,
          },
        ] as GenericNode[];
      },
    };
    const parsed = mystParse('{span #label .something .another open="true" max="5"}`_a_`', {
      roles: [TestRole],
    }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position,
          children: [
            {
              type: 'mystRole',
              position: positionFn(1, 1, 1, 59),
              name: 'span',
              value: '_a_',
              children: [
                {
                  type: 'span',
                  label: 'label',
                  identifier: 'label',
                  class: 'something another',
                  open: true,
                  max: 5,
                  children: [
                    {
                      type: 'emphasis',
                      position: positionFn(1, 1, 1, 1),
                      children: [{ type: 'text', value: 'a', position: positionFn(1, 1, 1, 1) }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
