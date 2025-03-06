import { describe, expect, it } from 'vitest';
import { migrate } from '../index';
import type { Parent } from 'mdast';

const SIMPLE_AST: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      children: [
        {
          // @ts-expect-error: invalid child type
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'This is an ',
            },
            {
              type: 'emphasis',
              children: [
                {
                  type: 'text',
                  value: 'interesting',
                },
              ],
            },
            {
              type: 'text',
              value: ' file. See ',
            },
            {
              type: 'link',
              url: '#other',
              children: [],
              // @ts-expect-error: unknown field
              urlSource: '#other',
            },
            {
              type: 'text',
              value: ' for more.',
            },
          ],
        },
        {
          // @ts-expect-error: invalid child type
          type: 'code',
          lang: 'python',
          value: 'Some code',
        },
      ],
    },
  ],
};

const SIMPLE_V3_AST_WITH_OUTPUT: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      children: [
        {
          // @ts-expect-error: invalid child type
          type: 'outputs',
          id: 'abc123',
          children: [
            {
              // @ts-expect-error: invalid child type
              type: 'output',
              children: [],
              jupyter_data: {
                output_type: 'display_data',
                execution_count: 3,
                metadata: {},
                data: {
                  'application/octet-stream': {
                    content_type: 'application/octet-stream',
                    hash: 'def456',
                    path: '/my/path/def456.png',
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
};

const SIMPLE_V2_AST_WITH_OUTPUT: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      children: [
        {
          // @ts-expect-error: invalid child type
          type: 'output',
          id: 'abc123',
          // @ts-expect-error: invalid type
          data: [
            {
              output_type: 'display_data',
              execution_count: 3,
              metadata: {},
              data: {
                'application/octet-stream': {
                  content_type: 'application/octet-stream',
                  hash: 'def456',
                  path: '/my/path/def456.png',
                },
              },
            },
          ],
          children: [],
        },
      ],
    },
  ],
};

describe('downgrade 3->2', () => {
  it('leaves a simple AST unchanged', async () => {
    const mdast = structuredClone(SIMPLE_AST) as any;
    const result = await migrate({ version: 3, mdast }, { to: 2 });
    expect(result.version).toBe(2);
    expect(mdast).toStrictEqual(SIMPLE_AST);
  });
  it('downgrades an AST with outputs', async () => {
    const mdast = structuredClone(SIMPLE_V3_AST_WITH_OUTPUT);
    const result = await migrate({ version: 3, mdast }, { to: 2 });
    expect(result.version).toBe(2);
    expect(mdast).toStrictEqual(SIMPLE_V2_AST_WITH_OUTPUT);
  });
});

describe('upgrade 3->2', () => {
  it('leaves a simple AST unchanged', async () => {
    const mdast = structuredClone(SIMPLE_AST) as any;
    const result = await migrate({ version: 2, mdast }, { to: 3 });
    expect(result.version).toBe(3);
    expect(mdast).toStrictEqual(SIMPLE_AST);
  });
  it('upgrades an AST with output', async () => {
    const mdast = structuredClone(SIMPLE_V2_AST_WITH_OUTPUT);
    const result = await migrate({ version: 2, mdast }, { to: 3 });
    expect(result.version).toBe(3);
    expect(mdast).toStrictEqual(SIMPLE_V3_AST_WITH_OUTPUT);
  });
});
