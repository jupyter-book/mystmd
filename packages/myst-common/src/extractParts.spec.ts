import type { Root } from 'mdast';
import { extractPart } from './extractParts';

describe('extractPart', () => {
  it('no tagged part returns undefined', async () => {
    expect(
      extractPart(
        { type: 'root', children: [{ type: 'text', value: 'untagged content' }] },
        'test_tag',
      ),
    ).toEqual(undefined);
  });
  it('tagged part removed from tree and returned', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { tags: ['test_tag'] },
          children: [{ type: 'text', value: 'tagged content' }],
        },
        {
          type: 'block' as any,
          data: { parts: ['other_tag'] },
          children: [{ type: 'text', value: 'other part content' }],
        },
        {
          type: 'block' as any,
          data: { parts: ['other_tag', 'test_tag'] },
          children: [{ type: 'text', value: 'multiple parts' }],
        },
        {
          type: 'block' as any,
          data: { parts: ['test_tag'] },
          children: [{ type: 'text', value: 'single part' }],
        },
      ],
    };
    expect(extractPart(tree, 'test_tag')).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { parts: ['other_tag', 'test_tag'] },
          children: [{ type: 'text', value: 'multiple parts' }],
        },
        {
          type: 'block' as any,
          data: { parts: ['test_tag'] },
          children: [{ type: 'text', value: 'single part' }],
        },
      ],
    });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { tags: ['test_tag'] },
          children: [{ type: 'text', value: 'tagged content' }],
        },
        {
          type: 'block' as any,
          data: { parts: ['other_tag'] },
          children: [{ type: 'text', value: 'other part content' }],
        },
        {
          type: 'block' as any,
          data: { parts: ['other_tag'] },
          children: [{ type: 'text', value: 'multiple parts' }],
        },
      ],
    });
  });
});
