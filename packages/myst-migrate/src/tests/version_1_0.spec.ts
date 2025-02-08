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

const SIMPLE_V2_AST_WITH_FOOTNOTE: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      children: [
        {
          // @ts-expect-error: unknown type
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See the footnote',
            },
            {
              type: 'footnoteReference',
              identifier: '1',
              label: '1',
              // @ts-expect-error: unknown type
              enumerator: '1',
            },
          ],
        },
        {
          // @ts-expect-error: unknown type
          type: 'footnoteDefinition',
          identifier: '1',
          label: '1',
          children: [
            {
              // @ts-expect-error: unknown type
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'A footnote',
                },
              ],
            },
          ],
          enumerator: '1',
        },
      ],
    },
  ],
};

const SIMPLE_V1_AST_WITH_FOOTNOTE: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      children: [
        {
          // @ts-expect-error: unknown type
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See the footnote',
            },
            {
              type: 'footnoteReference',
              identifier: '1',
              label: '1',
              // @ts-expect-error: unknown type
              number: 1,
            },
          ],
        },
        {
          // @ts-expect-error: unknown type
          type: 'footnoteDefinition',
          identifier: '1',
          label: '1',
          children: [
            {
              // @ts-expect-error: unknown type
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'A footnote',
                },
              ],
            },
          ],
          number: 1,
        },
      ],
    },
  ],
};
const SIMPLE_V2_AST_WITH_INVALID_FOOTNOTE: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      children: [
        {
          // @ts-expect-error: unknown type
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See the footnote',
            },
            {
              type: 'footnoteReference',
              identifier: '1',
              label: '1',
              // @ts-expect-error: unknown type
              enumerator: '%s.1',
            },
          ],
        },
        {
          // @ts-expect-error: unknown type
          type: 'footnoteDefinition',
          identifier: '1',
          label: '1',
          children: [
            {
              // @ts-expect-error: unknown type
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'A footnote',
                },
              ],
            },
          ],
          enumerator: '%s.1',
        },
      ],
    },
  ],
};

const SIMPLE_V1_AST_WITH_INVALID_FOOTNOTE: Parent = {
  type: 'root',
  children: [
    {
      // @ts-expect-error: unknown type
      type: 'block',
      children: [
        {
          // @ts-expect-error: unknown type
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'See the footnote',
            },
            {
              type: 'footnoteReference',
              identifier: '1',
              label: '1',
            },
          ],
        },
        {
          // @ts-expect-error: unknown type
          type: 'footnoteDefinition',
          identifier: '1',
          label: '1',
          children: [
            {
              // @ts-expect-error: unknown type
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  value: 'A footnote',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
describe('downgrade 1->0', () => {
  it('leaves a simple AST unchanged', async () => {
    const mdast = structuredClone(SIMPLE_AST);
    const result = await migrate({ version: 1, mdast }, { to: 0 });
    expect(result.version).toBe(0);
    expect(mdast).toStrictEqual(SIMPLE_AST);
  });
  it('downgrades a v1 AST with footnotes', async () => {
    const mdast = structuredClone(SIMPLE_V2_AST_WITH_FOOTNOTE);
    const result = await migrate({ version: 1, mdast }, { to: 0 });
    expect(result.version).toBe(0);
    expect(mdast).toStrictEqual(SIMPLE_V1_AST_WITH_FOOTNOTE);
  });
  it('downgrades a v1 AST with invalid footnotes', async () => {
    const mdast = structuredClone(SIMPLE_V2_AST_WITH_INVALID_FOOTNOTE);
    const result = await migrate({ version: 1, mdast }, { to: 0 });
    expect(result.version).toBe(0);
    expect(mdast).toStrictEqual(SIMPLE_V1_AST_WITH_INVALID_FOOTNOTE);
  });
});
