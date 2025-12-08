import { describe, expect, test } from 'vitest';
import {
  normalizeLabel,
  RuleId,
  type GenericNode,
  type RoleData,
  type RoleSpec,
} from 'myst-common';
import { mystParse } from '../../src';
import { position, positionFn } from '../position';
import { VFile } from 'vfile';

describe('role spec with options', () => {
  test('complex inline role with options', () => {
    const TestRole: RoleSpec = {
      name: 'widget',
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
            type: 'widget',
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
    const parsed = mystParse('{widget #label .something .another open="true" max="5"}`_a_`', {
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
              position: positionFn(1, 1, 1, 61),
              name: 'widget',
              options: {
                class: 'something another',
                label: 'label',
                max: 5,
                open: true,
              },
              value: '_a_',
              children: [
                {
                  type: 'widget',
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
  test('Errors not raised for roles that are not processed', () => {
    const vfile1 = new VFile();
    mystParse('{cite}`` {noerror}`asdf` ``', { vfile: vfile1 }) as any;
    expect(vfile1.messages).toEqual([]);
    const vfile2 = new VFile();
    mystParse('{error}`asdf`', { vfile: vfile2 }) as any;
    expect(vfile2.messages).toMatchObject([
      {
        message: 'unknown role: error',
        ruleId: RuleId.roleKnown,
      },
    ]);
  });
});
