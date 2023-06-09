import { describe, expect, test } from 'vitest';
import type { GenericNode, RoleData, RoleSpec } from 'myst-common';
import { mystParse } from '../../src';
import { position } from '../position';

describe('custom role extensions', () => {
  test('test role with string body', () => {
    const TestRole: RoleSpec = {
      name: 'test',
      body: {
        type: 'string' as any,
      },
      run(data: RoleData) {
        return [{ type: 'test', value: `test: ${data.body}` }];
      },
    };
    const parsed = mystParse('{test}`_a_`', { roles: [TestRole] }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position,
          children: [
            {
              type: 'mystRole',
              position,
              name: 'test',
              value: '_a_',
              children: [
                {
                  type: 'test',
                  value: 'test: _a_',
                },
              ],
            },
          ],
        },
      ],
    });
  });
  test('test role with parsed body', () => {
    const TestRole: RoleSpec = {
      name: 'test',
      body: {
        type: 'parsed' as any,
      },
      run(data: RoleData) {
        const children = data.body ? (data.body as GenericNode[]) : [];
        return [{ type: 'test', children }];
      },
    };
    const parsed = mystParse('{test}`_a_`', { roles: [TestRole] }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position,
          children: [
            {
              type: 'mystRole',
              position,
              name: 'test',
              value: '_a_',
              children: [
                {
                  type: 'test',
                  children: [
                    {
                      type: 'emphasis',
                      children: [
                        {
                          type: 'text',
                          value: 'a',
                        },
                      ],
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
  test('test role alias string', () => {
    const TestRole: RoleSpec = {
      name: 'test',
      alias: 'abc',
      body: {
        type: 'string' as any,
      },
      run(data: RoleData) {
        return [{ type: 'test', value: `test: ${data.body}` }];
      },
    };
    const parsed = mystParse('{abc}`_a_`', { roles: [TestRole] }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position,
          children: [
            {
              type: 'mystRole',
              position,
              name: 'abc',
              value: '_a_',
              children: [
                {
                  type: 'test',
                  value: 'test: _a_',
                },
              ],
            },
          ],
        },
      ],
    });
  });
  test('test role alias string list', () => {
    const TestRole: RoleSpec = {
      name: 'test',
      alias: ['abc', 'def'],
      body: {
        type: 'string' as any,
      },
      run(data: RoleData) {
        return [{ type: 'test', value: `test: ${data.body}` }];
      },
    };
    const parsed = mystParse('{def}`_a_`', { roles: [TestRole] }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position,
          children: [
            {
              type: 'mystRole',
              position,
              name: 'def',
              value: '_a_',
              children: [
                {
                  type: 'test',
                  value: 'test: _a_',
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
