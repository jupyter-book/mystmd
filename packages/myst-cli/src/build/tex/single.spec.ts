import type { Root } from 'mdast';
import { extractTexPart } from './single';

describe('extractPart', () => {
  it('no tagged part returns undefined', async () => {
    expect(
      extractTexPart(
        { type: 'root', children: [{ type: 'text', value: 'untagged content' }] },
        { id: 'test_tag', required: true },
        {},
        { jtex: 'v1' },
      ),
    ).toEqual(undefined);
  });
  it('tagged part removed from tree and returned', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { tags: ['other_tag'] },
          children: [{ type: 'text', value: 'untagged content' }],
        },
        {
          type: 'block' as any,
          data: { tags: ['test_tag'] },
          children: [{ type: 'text', value: 'tagged content' }],
        },
        {
          type: 'block' as any,
          data: { tags: ['other_tag', 'test_tag'] },
          children: [{ type: 'text', value: 'also tagged content' }],
        },
      ],
    };
    expect(extractTexPart(tree, { id: 'test_tag' }, {}, { jtex: 'v1' })).toEqual({
      value: 'tagged content\n\nalso tagged content',
      imports: [],
      commands: {},
    });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { tags: ['other_tag'] },
          children: [{ type: 'text', value: 'untagged content' }],
        },
      ],
    });
  });
  it('tagged part meeting maximums passes', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { tags: ['test_tag'] },
          children: [{ type: 'text', value: 'tagged content' }],
        },
      ],
    };
    expect(
      extractTexPart(tree, { id: 'test_tag', max_chars: 1000, max_words: 100 }, {}, { jtex: 'v1' }),
    ).toEqual({
      value: 'tagged content',
      imports: [],
      commands: {},
    });
  });
  it('exceeding max chars passes', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { tags: ['test_tag'] },
          children: [{ type: 'text', value: 'tagged content' }],
        },
      ],
    };
    expect(extractTexPart(tree, { id: 'test_tag', max_chars: 5 }, {}, { jtex: 'v1' })).toEqual({
      value: 'tagged content',
      imports: [],
      commands: {},
    });
  });
  it('exceeding max words passes', async () => {
    const tree: Root = {
      type: 'root',
      children: [
        {
          type: 'block' as any,
          data: { tags: ['test_tag'] },
          children: [{ type: 'text', value: 'tagged content' }],
        },
      ],
    };
    expect(extractTexPart(tree, { id: 'test_tag', max_words: 1 }, {}, { jtex: 'v1' })).toEqual({
      value: 'tagged content',
      imports: [],
      commands: {},
    });
  });
});
