import { describe, expect, test } from 'vitest';
import type { GenericNode, DirectiveData, DirectiveSpec } from 'myst-common';
import { mystParse } from '../../src';
import { positionFn } from '../position';

describe('custom directive extensions', () => {
  test('test directive with string body', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      body: {
        type: 'string' as any,
      },
      run(data: DirectiveData) {
        return [{ type: 'test', value: `test: ${data.body}` }];
      },
    };
    const parsed = mystParse('```{test}\n_a_\n```', { directives: [TestDirective] }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 3),
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
    });
  });
  test('test directive with parsed body', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      body: {
        type: 'parsed' as any,
      },
      run(data: DirectiveData) {
        return [{ type: 'test', children: data.body as GenericNode[] }];
      },
    };
    const parsed = mystParse('```{test}\n_a_\n```', { directives: [TestDirective] }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 3),
          name: 'test',
          value: '_a_',
          children: [
            {
              type: 'test',
              children: [
                {
                  type: 'paragraph',
                  position: positionFn(2, 2),
                  children: [
                    {
                      type: 'emphasis',
                      position: positionFn(2, 2),
                      children: [
                        {
                          type: 'text',
                          position: positionFn(2, 2),
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
  test('test directive with string arg', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      arg: {
        type: 'string' as any,
      },
      body: {
        type: 'string' as any,
      },
      run(data: DirectiveData) {
        return [{ type: data.arg as string, value: `test: ${data.body}` }];
      },
    };
    const parsed = mystParse('```{test} hello\n_a_\n```', { directives: [TestDirective] }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 3),
          name: 'test',
          args: 'hello',
          value: '_a_',
          children: [
            {
              type: 'hello',
              value: 'test: _a_',
            },
          ],
        },
      ],
    });
  });
  test('test directive with parsed arg', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      arg: {
        type: 'parsed' as any,
      },
      body: {
        type: 'string' as any,
      },
      run(data: DirectiveData) {
        return [{ type: data.body as string, children: data.arg as GenericNode[] }];
      },
    };
    const parsed = mystParse('```{test} _a_\nhello\n```', { directives: [TestDirective] }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 3),
          name: 'test',
          args: '_a_',
          value: 'hello',
          children: [
            {
              type: 'hello',
              children: [
                {
                  type: 'emphasis',
                  position: positionFn(1, 1),
                  children: [
                    {
                      type: 'text',
                      position: positionFn(1, 1),
                      value: 'a',
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
  test('test directive with flag option - implicit', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      options: {
        flag: {
          type: 'boolean' as any,
        },
      },
      run(data: DirectiveData) {
        return [{ type: 'test', value: data.options?.flag ? 'flag' : 'no flag' }];
      },
    };
    const parsedTrue = mystParse('```{test}\n:flag:\n```', { directives: [TestDirective] }) as any;
    expect(parsedTrue).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 3),
          name: 'test',
          options: {
            flag: true,
          },
          children: [
            {
              type: 'test',
              value: 'flag',
            },
          ],
        },
      ],
    });
  });
  test('test directive with flag option - false', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      options: {
        flag: {
          type: 'boolean' as any,
        },
      },
      run(data: DirectiveData) {
        return [{ type: 'test', value: data.options?.flag ? 'flag' : 'no flag' }];
      },
    };
    const parsedFalse = mystParse('```{test}\n:flag: false\n```', {
      directives: [TestDirective],
    }) as any;
    expect(parsedFalse).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 3),
          name: 'test',
          options: {
            flag: 'false',
          },
          children: [
            {
              type: 'test',
              value: 'no flag',
            },
          ],
        },
      ],
    });
  });
  test('test directive with parsed option', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      options: {
        something: {
          type: 'parsed' as any,
        },
      },
      body: {
        type: 'string' as any,
      },
      run(data: DirectiveData) {
        return [{ type: data.body as string, children: data.options?.something as GenericNode[] }];
      },
    };
    const parsed = mystParse('```{test}\n:something: _a_\nhello\n```', {
      directives: [TestDirective],
    }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 4),
          name: 'test',
          options: {
            something: '_a_',
          },
          value: 'hello',
          children: [
            {
              type: 'hello',
              children: [
                {
                  type: 'emphasis',
                  position: positionFn(2, 2),
                  children: [
                    {
                      type: 'text',
                      value: 'a',
                      position: positionFn(2, 2),
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
  test('test directive with extra option', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      options: {
        a: {
          type: 'string' as any,
        },
      },
      run(data: DirectiveData) {
        return [{ type: 'test', value: data.options?.a as string }];
      },
    };
    const parsedFalse = mystParse('```{test}\n:a: x\n:b: y\n```', {
      directives: [TestDirective],
    }) as any;
    expect(parsedFalse).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 4),
          name: 'test',
          options: {
            a: 'x',
            b: 'y',
          },
          children: [
            {
              type: 'test',
              value: 'x',
            },
          ],
        },
      ],
    });
  });
  test('test directive with duplicate option', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      options: {
        a: {
          type: 'string' as any,
          required: true,
        },
      },
      run(data: DirectiveData) {
        return [{ type: 'test', value: data.options?.a || '' }] as GenericNode[];
      },
    };
    const parsedFalse = mystParse('```{test}\n:a: x\n:a: y\n```', {
      directives: [TestDirective],
    }) as any;
    expect(parsedFalse).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 4),
          name: 'test',
          options: {
            a: 'x',
          },
          children: [
            {
              type: 'test',
              value: 'x',
            },
          ],
        },
      ],
    });
  });
  test('test directive alias string', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      alias: ['abc'],
      body: {
        type: 'string' as any,
      },
      run(data: DirectiveData) {
        return [{ type: 'test', value: `test: ${data.body}` }];
      },
    };
    const parsed = mystParse('```{abc}\n_a_\n```', { directives: [TestDirective] }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 3),
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
    });
  });
  test('test directive alias string list', () => {
    const TestDirective: DirectiveSpec = {
      name: 'test',
      alias: ['abc', 'def'],
      body: {
        type: 'string' as any,
      },
      run(data: DirectiveData) {
        return [{ type: 'test', value: `test: ${data.body}` }];
      },
    };
    const parsed = mystParse('```{def}\n_a_\n```', { directives: [TestDirective] }) as any;
    expect(parsed).toEqual({
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          position: positionFn(1, 3),
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
    });
  });
});
