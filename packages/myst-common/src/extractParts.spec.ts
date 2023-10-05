import { describe, expect, it } from 'vitest';
import { extractPart } from './extractParts';
import type { GenericParent } from '../dist';

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
  it('extract parts (with lists)', async () => {
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
});
