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

const V2_AST_WITH_PLACEHOLDER: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      kind: 'notebook-code',
      children: [
        {
          // @ts-expect-error: invalid child type
          type: 'code',
          lang: 'python',
          executable: true,
          value: 'display("Hello world", "Goodbye world")',
          key: 'ktztPVekaM',
        },
        {
          // @ts-expect-error: invalid child type
          type: 'output',
          id: 'a-unique-id',
          // @ts-expect-error: invalid type
          data: [
            {
              output_type: 'display_data',
              metadata: {},
              data: {
                'text/plain': {
                  content: "'Hello world'",
                  content_type: 'text/plain',
                },
              },
            },
            {
              output_type: 'display_data',
              metadata: {},
              data: {
                'text/plain': {
                  content: "'Goodbye world'",
                  content_type: 'text/plain',
                },
              },
            },
          ],
          children: [
            {
              type: 'image',
              // @ts-expect-error: unknown property
              placeholder: true,
              url: 'some-image.png',
              urlSource: 'test.png',
            },
          ],
        },
      ],
    },
  ],
};

const V3_AST_WITH_PLACEHOLDER: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      kind: 'notebook-code',
      children: [
        {
          // @ts-expect-error: invalid child type
          type: 'code',
          lang: 'python',
          executable: true,
          value: 'display("Hello world", "Goodbye world")',
          key: 'ktztPVekaM',
        },
        {
          // @ts-expect-error: invalid child type
          type: 'outputs',
          id: 'a-unique-id',
          children: [
            {
              // @ts-expect-error: invalid child type
              type: 'output',
              children: [],
              jupyter_data: {
                output_type: 'display_data',
                metadata: {},
                data: {
                  'text/plain': {
                    content: "'Hello world'",
                    content_type: 'text/plain',
                  },
                },
              },
            },
            {
              // @ts-expect-error: invalid child type
              type: 'output',
              children: [],
              jupyter_data: {
                output_type: 'display_data',
                metadata: {},
                data: {
                  'text/plain': {
                    content: "'Goodbye world'",
                    content_type: 'text/plain',
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
describe('downgrade 3→2', () => {
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
  it('downgrades an AST with outputs', async () => {
    const mdast = structuredClone(V3_AST_WITH_PLACEHOLDER);
    const result = await migrate({ version: 3, mdast }, { to: 2 });
    expect(result.version).toBe(2);
    expect(mdast).toStrictEqual(V2_AST_WITH_PLACEHOLDER);
  });
});

describe('upgrade 2→3', () => {
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
  it('upgrades an AST with cells and placeholders', async () => {
    const mdast = structuredClone(V2_AST_WITH_PLACEHOLDER);
    const result = await migrate({ version: 2, mdast }, { to: 3 });
    expect(result.version).toBe(3);
    expect(mdast).toStrictEqual(V3_AST_WITH_PLACEHOLDER);
  });
});
