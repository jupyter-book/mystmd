import { describe, expect, it } from 'vitest';
import { extractImplicitPart, extractPart } from './extractParts';
import type { GenericParent } from '../dist';
import { copyNode } from './utils';

describe('extractPart', () => {
  it('no part returns undefined', async () => {
    expect(
      extractPart(
        { type: 'root', children: [{ type: 'text', value: 'untagged content' }] },
        'test_part',
      ),
    ).toEqual(undefined);
  });
  it('part removed from tree and returned', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'other_tag' },
          children: [{ type: 'text', value: 'untagged content' }],
        },
        {
          type: 'block' as any,
          data: { part: 'test_part' },
          children: [{ type: 'text', value: 'a first part' }],
        },
        {
          type: 'block' as any,
          data: { tags: ['other_tag', 'test_part'] },
          children: [{ type: 'text', value: 'also tagged content' }],
        },
        {
          type: 'block' as any,
          data: { part: 'test_part' },
          children: [{ type: 'text', value: 'a part' }],
        },
      ],
    };
    expect(extractPart(tree, 'test_part')).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'test_part' },
          children: [{ type: 'text', value: 'a first part' }],
        },
        {
          type: 'block' as any,
          data: { part: 'test_part', tags: ['other_tag'] },
          children: [{ type: 'text', value: 'also tagged content' }],
        },
        {
          type: 'block' as any,
          data: { part: 'test_part' },
          children: [{ type: 'text', value: 'a part' }],
        },
      ],
    });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'other_tag' },
          children: [{ type: 'text', value: 'untagged content' }],
        },
      ],
    });
  });
  it('extract tagged part', async () => {
    expect(
      extractPart(
        {
          type: 'root',
          children: [
            {
              type: 'block' as any,
              data: { tags: ['tagged_part'] },
              children: [{ type: 'text', value: 'untagged content' }],
            },
            {
              type: 'block' as any,
              data: { tags: ['other_tag', 'test_part'] },
              children: [{ type: 'text', value: 'also tagged content' }],
            },
          ],
        },
        'tagged_part',
      ),
    ).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'tagged_part' },
          children: [{ type: 'text', value: 'untagged content' }],
        },
      ],
    });
  });
  it('extract parts (with lists and case insensitivity)', async () => {
    expect(
      extractPart(
        {
          type: 'root',
          children: [
            {
              type: 'block' as any,
              data: { tags: ['TAGGED_part'] },
              children: [{ type: 'text', value: 'untagged content' }],
            },
            {
              type: 'block' as any,
              data: { tags: ['other_tag', 'TEST_PART'] },
              children: [{ type: 'text', value: 'also tagged content' }],
            },
          ],
        },
        ['test_part', 'TAGGED_PART'],
        { removePartData: false },
      ),
    ).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'test_part' }, // We transform it to the first one.
          children: [{ type: 'text', value: 'untagged content' }],
        },
        {
          type: 'block' as any,
          data: { part: 'test_part', tags: ['other_tag'] },
          children: [{ type: 'text', value: 'also tagged content' }],
        },
      ],
    });
  });
  it('extract parts (lists, remove)', async () => {
    expect(
      extractPart(
        {
          type: 'root',
          children: [
            {
              type: 'block' as any,
              data: { tags: ['tagged_part'] },
              children: [{ type: 'text', value: 'untagged content' }],
            },
            {
              type: 'block' as any,
              data: { tags: ['other_tag', 'test_part'] },
              children: [{ type: 'text', value: 'also tagged content' }],
            },
          ],
        },
        ['test_part', 'tagged_part'],
        { removePartData: true },
      ),
    ).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: {}, // Removed!
          children: [{ type: 'text', value: 'untagged content' }],
        },
        {
          type: 'block' as any,
          data: { tags: ['other_tag'] },
          children: [{ type: 'text', value: 'also tagged content' }],
        },
      ],
    });
  });
  it('part aliases are respected as part', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          children: [{ type: 'text', value: 'no part' }],
        },
        {
          type: 'block' as any,
          data: { part: 'Acknowledgements' },
          children: [{ type: 'text', value: 'e between g and m' }],
        },
      ],
    };
    expect(extractPart(tree, 'acknowledgments')).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'acknowledgments' },
          children: [{ type: 'text', value: 'e between g and m' }],
        },
      ],
    });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          children: [{ type: 'text', value: 'no part' }],
        },
      ],
    });
  });
  it('part aliases are respected as input', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          children: [{ type: 'text', value: 'no part' }],
        },
        {
          type: 'block' as any,
          data: { part: 'Acknowledgments' },
          children: [{ type: 'text', value: 'no e between g and m' }],
        },
      ],
    };
    expect(extractPart(tree, 'ack')).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'acknowledgments' },
          children: [{ type: 'text', value: 'no e between g and m' }],
        },
      ],
    });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          children: [{ type: 'text', value: 'no part' }],
        },
      ],
    });
  });
  it('frontmatter part prioritized, tagged block removed, implicit part unchanged', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'other_tag' },
          children: [{ type: 'text', value: 'untagged content' }],
        },
        {
          type: 'block' as any,
          data: { part: 'test_part' },
          children: [{ type: 'text', value: 'block part' }],
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'test_part' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'implicit part' }],
        },
      ],
    };
    expect(
      extractPart(tree, 'test_part', {
        frontmatterParts: {
          test_part: {
            mdast: {
              type: 'root',
              children: [
                {
                  type: 'block',
                  children: [
                    { type: 'paragraph', children: [{ type: 'text', value: 'frontmatter part' }] },
                  ],
                },
              ],
            },
          },
        },
      }),
    ).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          data: {
            part: 'test_part',
          },
          children: [
            { type: 'paragraph', children: [{ type: 'text', value: 'frontmatter part' }] },
          ],
        },
      ],
    });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { part: 'other_tag' },
          children: [{ type: 'text', value: 'untagged content' }],
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'test_part' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'implicit part' }],
        },
      ],
    });
  });
});

describe('extractImplicitPart', () => {
  it('no part returns undefined', async () => {
    expect(
      extractImplicitPart({
        type: 'root',
        children: [{ type: 'text', value: 'untagged content' }],
      }),
    ).toEqual(undefined);
  });
  it('part heading/content is removed from tree at top level and returned', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'one' }],
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'abstract' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'two' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'three' }],
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'intro' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'four' }],
        },
      ],
    };
    expect(extractImplicitPart(tree, 'abstract')).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          data: { part: 'abstract' },
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'two' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'three' }],
            },
          ],
        },
      ],
    });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'one' }],
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'intro' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'four' }],
        },
      ],
    });
  });
  it('part heading/content is removed from top level block and returned', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'one' }],
            },
            {
              type: 'heading',
              children: [{ type: 'text', value: 'abstract' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'two' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'three' }],
            },
            {
              type: 'heading',
              children: [{ type: 'text', value: 'intro' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'four' }],
            },
          ],
        },
      ],
    };
    expect(extractImplicitPart(tree, 'abstract')).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          data: { part: 'abstract' },
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'two' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'three' }],
            },
          ],
        },
      ],
    });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'one' }],
            },
            {
              type: 'heading',
              children: [{ type: 'text', value: 'intro' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'four' }],
            },
          ],
        },
      ],
    });
  });
  it('part heading/content is not removed when nested', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'block',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'one' }],
                },
                {
                  type: 'heading',
                  children: [{ type: 'text', value: 'abstract' }],
                },
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'two' }],
                },
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'three' }],
                },
                {
                  type: 'heading',
                  children: [{ type: 'text', value: 'intro' }],
                },
                {
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'four' }],
                },
              ],
            },
          ],
        },
      ],
    };
    const treeCopy = copyNode(tree);
    expect(extractImplicitPart(tree, 'abstract')).toEqual(undefined);
    expect(tree).toEqual(treeCopy);
  });
  it('parts from top and block levels concatenate', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'one' }],
            },
            {
              type: 'heading',
              children: [{ type: 'text', value: 'abstract' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'two' }],
            },
          ],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'three' }],
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'abstract' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'four' }],
        },
      ],
    };
    expect(extractImplicitPart(tree, 'abstract')).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          data: { part: 'abstract' },
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'two' }],
            },
          ],
        },
        {
          type: 'block',
          data: { part: 'abstract' },
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'four' }],
            },
          ],
        },
      ],
    });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'one' }],
            },
          ],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'three' }],
        },
      ],
    });
  });
  it('part headings with no content remain', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'one' }],
            },
            {
              type: 'heading',
              children: [{ type: 'text', value: 'abstract' }],
            },
            {
              type: 'heading',
              children: [{ type: 'text', value: 'not abstract' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'two' }],
            },
          ],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'three' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'four' }],
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'abstract' }],
        },
      ],
    };
    const treeCopy = copyNode(tree);
    expect(extractImplicitPart(tree, 'abstract')).toEqual(undefined);
    expect(tree).toEqual(treeCopy);
  });
  it('part is not removed from block with part', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block',
          data: { part: 'explicit' },
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'one' }],
            },
            {
              type: 'heading',
              children: [{ type: 'text', value: 'abstract' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'two' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'three' }],
            },
            {
              type: 'heading',
              children: [{ type: 'text', value: 'intro' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'four' }],
            },
          ],
        },
      ],
    };
    const treeCopy = copyNode(tree);
    expect(extractImplicitPart(tree, 'abstract')).toEqual(undefined);
    expect(tree).toEqual(treeCopy);
  });
  it('part heading with format removed', async () => {
    const tree: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'one' }],
        },
        {
          type: 'heading',
          children: [
            { type: 'text', value: 'abs' },
            { type: 'strong', children: [{ type: 'text', value: 'TRACT' }] },
          ],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'two' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'three' }],
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'intro' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'four' }],
        },
      ],
    };
    expect(extractImplicitPart(tree, 'abstract')).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          data: { part: 'abstract' },
          children: [
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'two' }],
            },
            {
              type: 'paragraph',
              children: [{ type: 'text', value: 'three' }],
            },
          ],
        },
      ],
    });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'one' }],
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'intro' }],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', value: 'four' }],
        },
      ],
    });
  });
});
