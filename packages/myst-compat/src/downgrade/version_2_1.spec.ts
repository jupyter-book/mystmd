import { describe, expect, it } from 'vitest';
import { downgrade } from './version_2_1.js';
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
describe('downgrade 2->1', () => {
  it('leaves a simple AST unchanged', () => {
    const ast = structuredClone(SIMPLE_AST);
    downgrade(ast);
    expect(ast).toStrictEqual(SIMPLE_AST);
  });
  it('downgrades a v2 AST with footnotes', () => {
    const ast = structuredClone(SIMPLE_V2_AST_WITH_FOOTNOTE);
    downgrade(ast);
    expect(ast).toStrictEqual(SIMPLE_V1_AST_WITH_FOOTNOTE);
  });
  it('downgrades a v2 AST with invalid footnotes', () => {
    const ast = structuredClone(SIMPLE_V2_AST_WITH_INVALID_FOOTNOTE);
    downgrade(ast);
    expect(ast).toStrictEqual(SIMPLE_V1_AST_WITH_INVALID_FOOTNOTE);
  });
});
