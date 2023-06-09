import { describe, expect, it } from 'vitest';
import type { Root } from 'mdast';
import { extractPart } from './extractParts';

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
    const tree: Root = {
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
        {
          type: 'block' as any,
          data: { tags: ['other_tag', 'test_part'] },
          children: [{ type: 'text', value: 'also tagged content' }],
        },
      ],
    });
  });
});
